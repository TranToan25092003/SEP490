const { clerkClient } = require("../config/clerk");
const { Notification, ServiceOrder, Booking, Invoice } = require("../model");
const { emitToRoom } = require("../socket/socketUtils");
const { UsersService } = require("./users.service");

const HOTLINE = process.env.BUSINESS_HOTLINE || "1900 6868";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.FRONTEND_URL || "";
const STAFF_BOOKING_LIST_PATH = "/staff/booking/";
const DEFAULT_CLERK_ORG_ID = "org_32tzUd7dUcFW7Te5gxEO4VcgkX1";
const CLERK_ORGANIZATION_ID =
  process.env.CLERK_ORGANIZATION_ID ||
  process.env.CLERK_STAFF_ORGANIZATION_ID ||
  DEFAULT_CLERK_ORG_ID ||
  null;
const ORG_MEMBERSHIP_PAGE_SIZE =
  Number(process.env.CLERK_ORG_MEMBERSHIP_PAGE_SIZE) || 100;
// Các role được xem là "staff" cho mục đích nhận thông báo nội bộ

const STAFF_ORG_ROLES = ["staff", "technician"];

const SERVICE_ORDER_STATUS_LABELS = {
  created: "được tạo",
  waiting_inspection: "đang chờ kiểm tra",
  inspection_completed: "đã hoàn tất kiểm tra",
  waiting_customer_approval: "chờ khách xác nhận",
  approved: "được phê duyệt",
  scheduled: "đã được xếp lịch",
  servicing: "đang sửa chữa",
  completed: "đã hoàn thành",
  cancelled: "đã bị hủy",
};

let cachedStaffIds = null;
let lastStaffFetch = 0;
const STAFF_CACHE_TTL = 5 * 60 * 1000;
const customerNameCache = new Map();

function buildAbsoluteLink(pathname) {
  if (!pathname) return "";
  if (!APP_BASE_URL) return pathname;
  return `${APP_BASE_URL.replace(/\/$/, "")}${pathname}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getShortId(id, length = 6) {
  if (!id) return "N/A";
  const str = id.toString();
  return str.slice(-length).toUpperCase();
}

function getStaffServiceOrderLink(serviceOrderId) {
  if (!serviceOrderId) return "/staff/service-order/";
  return `/staff/service-order/${serviceOrderId}`;
}

async function resolveCustomerName(clerkId) {
  if (!clerkId) return "Quý khách";
  if (customerNameCache.has(clerkId)) {
    return customerNameCache.get(clerkId);
  }

  try {
    const map = await UsersService.getFullNamesByIds([clerkId]);
    const fullName = map?.[clerkId];
    const name =
      fullName && fullName !== "Không có tên" ? fullName : "Quý khách";
    customerNameCache.set(clerkId, name);
    return name;
  } catch {
    return "Quý khách";
  }
}

function hasManagerRole(normalizedRoles = []) {
  return normalizedRoles.some(
    (role) =>
      role === "manager" ||
      role === "mana" ||
      role.includes("manager") ||
      role.includes("mana")
  );
}

function hasAdminRole(normalizedRoles = []) {
  return normalizedRoles.some(
    (role) => role === "admin" || role.includes("admin")
  );
}

function normalizeRoles(user) {
  const rawRoles = [];
  const publicMeta = user.publicMetadata || {};
  const privateMeta = user.privateMetadata || {};

  if (publicMeta.role) rawRoles.push(publicMeta.role);
  if (Array.isArray(publicMeta.roles)) rawRoles.push(...publicMeta.roles);
  if (privateMeta.role) rawRoles.push(privateMeta.role);
  if (Array.isArray(privateMeta.roles)) rawRoles.push(...privateMeta.roles);

  const normalized = rawRoles
    .filter(Boolean)
    .map((role) => role.toString().toLowerCase());

  console.log("[NotificationService] normalizeRoles", {
    userId: user.id,
    normalized,
    rawRoles,
    publicMeta,
    privateMeta,
  });

  return normalized;
}

function userHasStaffRole(user) {
  const normalized = normalizeRoles(user);
  if (normalized.length === 0) return false;

  // Loại bỏ hoàn toàn manager/mana và admin khỏi nhóm staff
  if (hasManagerRole(normalized) || hasAdminRole(normalized)) return false;

  return normalized.some((role) => ["staff", "technician"].includes(role));
}

async function fetchStaffIdsFromOrganization() {
  if (!CLERK_ORGANIZATION_ID) {
    console.warn(
      "[NotificationService] CLERK_ORGANIZATION_ID is not configured. Skipping organization membership fallback."
    );
    return [];
  }

  const staffIds = new Set();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: CLERK_ORGANIZATION_ID,
        limit: ORG_MEMBERSHIP_PAGE_SIZE,
        offset,
      });

    const memberships = response?.data || [];

    memberships.forEach((membership) => {
      const role = membership.role?.toLowerCase() || "";
      const userId = membership.publicUserData?.userId;
      // Loại bỏ manager/mana/admin khỏi danh sách staff
      if (
        !userId ||
        !role ||
        role.includes("manager") ||
        role.includes("mana") ||
        role.includes("admin") ||
        !STAFF_ORG_ROLES.some((allowed) => role.includes(allowed))
      ) {
        return;
      }
      staffIds.add(userId);
    });

    hasMore = memberships.length === ORG_MEMBERSHIP_PAGE_SIZE;
    offset += memberships.length;
  }

  return Array.from(staffIds);
}

async function getStaffClerkIds() {
  const now = Date.now();
  if (cachedStaffIds && now - lastStaffFetch < STAFF_CACHE_TTL) {
    console.log(
      "[NotificationService] Using cached staffIds (",
      cachedStaffIds.length,
      ")"
    );
    return cachedStaffIds;
  }

  const staffUsers = await clerkClient.users.getUserList({ limit: 500 });
  const metadataIds = staffUsers.data
    .filter(userHasStaffRole)
    .map((user) => user.id);

  let organizationIds = [];
  if (CLERK_ORGANIZATION_ID) {
    organizationIds = await fetchStaffIdsFromOrganization();
  } else {
    console.warn(
      "[NotificationService] CLERK_ORGANIZATION_ID missing, relying only on metadata roles."
    );
  }

  const ids = Array.from(new Set([...metadataIds, ...organizationIds]));

  if (!ids.length) {
    console.warn(
      "[NotificationService] Không tìm thấy tài khoản staff trong Clerk. Vui lòng kiểm tra CLERK_ORGANIZATION_ID hoặc metadata role."
    );
  }

  console.log(
    "[NotificationService] Refetched staffIds from Clerk:",
    ids.length
  );
  cachedStaffIds = ids;
  lastStaffFetch = now;
  return cachedStaffIds;
}

async function isStaffUser(userId) {
  try {
    const staffIds = await getStaffClerkIds();
    return staffIds.includes(userId);
  } catch (error) {
    console.error(
      "[NotificationService] Error checking if user is staff:",
      error
    );
    return false;
  }
}

async function createNotification(notificationData) {
  try {
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();

    if (savedNotification) {
      const roomName = savedNotification.recipientClerkId;
      const eventName = "new_notification";
      const payload = savedNotification.toObject();
      emitToRoom(roomName, eventName, payload);
    }

    return savedNotification;
  } catch (error) {
    console.error(
      `Error creating notification: ${error.message}`,
      notificationData
    );
  }
}

async function notifyStaffGroup(payload) {
  try {
    const staffIds = await getStaffClerkIds();
    if (!staffIds || staffIds.length === 0) {
      console.warn(
        "[NotificationService] notifyStaffGroup aborted - no staff recipients.",
        payload?.type
      );
      return;
    }

    await Promise.all(
      staffIds.map((staffId) =>
        createNotification({
          ...payload,
          recipientClerkId: staffId,
          recipientType: "staff",
        })
      )
    );
  } catch (error) {
    console.error("Failed to notify staff:", error);
  }
}

async function ensureServiceOrderContext(serviceOrder) {
  if (!serviceOrder) return null;
  if (typeof serviceOrder.populate === "function") {
    await serviceOrder.populate({
      path: "booking_id",
      populate: { path: "vehicle_id" },
    });
    return serviceOrder;
  }

  return ServiceOrder.findById(serviceOrder._id)
    .populate({
      path: "booking_id",
      populate: { path: "vehicle_id" },
    })
    .exec();
}

async function ensureBookingContext(booking) {
  if (!booking) return null;
  if (typeof booking.populate === "function") {
    await booking.populate("vehicle_id");
    return booking;
  }

  return Booking.findById(booking._id).populate("vehicle_id").exec();
}

function getPlate(bookingDoc) {
  return bookingDoc?.vehicle_id?.license_plate || "xe của bạn";
}

async function notifyAllStaffOfNewComplaint(complaint) {
  try {
    let customerName = "Khách hàng";
    let bookingCode = getShortId(complaint.so_id);

    if (complaint.so_id) {
      const serviceOrder = await ServiceOrder.findById(complaint.so_id)
        .populate("booking_id", "customer_clerk_id")
        .exec();
      if (serviceOrder?.booking_id) {
        bookingCode = getShortId(serviceOrder.booking_id._id);
        customerName = await resolveCustomerName(
          serviceOrder.booking_id.customer_clerk_id
        );
      }
    }

    await notifyStaffGroup({
      type: "NEW_COMPLAINT_RECEIVED",
      title: "Có khiếu nại mới",
      message: `Có khiếu nại mới từ khách hàng ${customerName} đơn ${bookingCode}. Vui lòng kiểm tra và phản hồi.`,
      linkTo: `/staff/complaints/${complaint._id}`,
      actorClerkId: complaint.clerkId,
    });
  } catch (error) {
    console.error("Failed to notify all staff:", error);
  }
}

async function notifyCustomerOnReply(complaint) {
  if (!complaint || !complaint.reply) return;

  const notificationData = {
    recipientClerkId: complaint.clerkId,
    recipientType: "customer",
    type: "COMPLAINT_REPLIED",
    title: "Khiếu nại đã được phản hồi",
    message: `Yêu cầu khiếu nại của quý khách đã được phản hồi. Vui lòng kiểm tra tại: đây`,
    linkTo: `/complaint?replyComplaintId=${complaint._id}`,
    actorClerkId: complaint.reply.staffClerkId,
  };

  await createNotification(notificationData);
}

async function notifyCustomerComplaintSubmitted(complaint) {
  if (!complaint?.clerkId) return;
  const customerName = await resolveCustomerName(complaint.clerkId);

  await createNotification({
    recipientClerkId: complaint.clerkId,
    recipientType: "customer",
    type: "COMPLAINT_SUBMITTED",
    title: "Đã gửi khiếu nại",
    message: `Quý khách ${customerName} đã gửi khiếu nại thành công. Vui lòng đợi cửa hàng xác nhận.`,
    linkTo: "/complaint",
  });
}

async function notifyPasswordChanged({
  clerkId,
  changedAt = new Date(),
  hotline = HOTLINE,
}) {
  if (!clerkId) return;

  await createNotification({
    recipientClerkId: clerkId,
    recipientType: "customer",
    type: "PASSWORD_CHANGED",
    title: "Mật khẩu đã được thay đổi",
    message: `Mật khẩu đã được thay đổi lúc ${formatDateTime(
      changedAt
    )}. Nếu không phải quý khách, vui lòng liên hệ ${hotline}.`,
    linkTo: "/profile",
  });
}

async function notifyStaffOfNewBooking(booking) {
  const bookingDoc = await ensureBookingContext(booking);
  console.log("[NotificationService] notifyStaffOfNewBooking", bookingDoc);
  if (!bookingDoc) return;

  const plate = bookingDoc.vehicle_id?.license_plate || "không xác định";
  const customerName = await resolveCustomerName(bookingDoc.customer_clerk_id);
  const bookingCode = getShortId(bookingDoc._id);
  console.log(
    "[NotificationService] Staff booking notification payload:",
    JSON.stringify({
      customerName,
      bookingCode,
      recipient: bookingDoc.customer_clerk_id,
    })
  );
  await notifyStaffGroup({
    type: "NEW_BOOKING_CREATED",
    title: "Có lịch đặt mới",
    message: `Khách hàng ${customerName} - ${bookingCode} đã đặt lịch sửa xe cho xe ${plate}. Vui lòng xác nhận nhận việc.`,
    linkTo: STAFF_BOOKING_LIST_PATH,
    actorClerkId: bookingDoc.customer_clerk_id,
  });
}

async function notifyCustomerBookingCreated(booking) {
  const bookingDoc = await ensureBookingContext(booking);
  if (!bookingDoc) return;

  const customerClerkId = bookingDoc.customer_clerk_id;
  const customerName = await resolveCustomerName(customerClerkId);
  const bookingLink = `/booking/${bookingDoc._id}`;

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "BOOKING_CONFIRMED",
    title: "Đặt lịch thành công",
    message: `Quý khách ${customerName} đã đặt lịch sửa xe thành công. Vui lòng đợi cửa hàng xác nhận.`,
    linkTo: bookingLink,
  });
}

async function notifyCustomerBookingCancelled(booking) {
  const bookingDoc = await ensureBookingContext(booking);
  if (!bookingDoc) return;

  const customerClerkId = bookingDoc.customer_clerk_id;
  const customerName = await resolveCustomerName(customerClerkId);
  const cancelledBy = bookingDoc.cancelled_by || "customer";
  const cancelReason = bookingDoc.cancel_reason
    ? ` Lý do: ${bookingDoc.cancel_reason}.`
    : "";

  let title, message;
  if (cancelledBy === "staff") {
    title = "Đơn đặt lịch đã bị hủy";
    message = `Đơn đặt lịch của quý khách ${customerName} đã được hủy thành công.${cancelReason} Rất mong được phục vụ quý khách trong lần sau.`;
  } else {
    title = "Hủy đặt lịch thành công";
    message = `Quý khách ${customerName} đã hủy đặt lịch thành công.${cancelReason} Rất mong được phục vụ quý khách trong lần sau.`;
  }

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "BOOKING_CANCELLED",
    title,
    message,
    linkTo: "/booking",
  });
}

async function notifyStaffOfBookingCancelled(booking) {
  const bookingDoc = await ensureBookingContext(booking);
  console.log(
    "[NotificationService] notifyStaffOfBookingCancelled",
    bookingDoc
  );
  if (!bookingDoc) return;

  const plate = bookingDoc.vehicle_id?.license_plate || "không xác định";
  const customerName = await resolveCustomerName(bookingDoc.customer_clerk_id);
  const bookingCode = getShortId(bookingDoc._id);
  const cancelledBy = bookingDoc.cancelled_by || "customer";
  const cancelReason = bookingDoc.cancel_reason
    ? ` Lý do: ${bookingDoc.cancel_reason}.`
    : "";

  let message;
  if (cancelledBy === "staff") {
    message = `Hủy đặt lịch sửa xe thành công cho khách hàng ${customerName} - ${bookingCode} (xe ${plate}).${cancelReason}`;
  } else {
    message = `Khách hàng ${customerName} - ${bookingCode} đã hủy đặt lịch sửa xe cho xe ${plate}.${cancelReason}`;
  }

  console.log(
    "[NotificationService] Staff booking cancellation notification payload:",
    JSON.stringify({
      customerName,
      bookingCode,
      plate,
      cancelledBy,
    })
  );
  await notifyStaffGroup({
    type: "BOOKING_CANCELLED",
    title: "Đơn đặt lịch đã bị hủy",
    message,
    linkTo: STAFF_BOOKING_LIST_PATH,
    actorClerkId: bookingDoc.customer_clerk_id,
  });
}

async function notifyServiceOrderStatusChange({
  serviceOrder,
  actorClerkId = null,
}) {
  const serviceOrderDoc = await ensureServiceOrderContext(serviceOrder);
  if (!serviceOrderDoc?.booking_id) return;

  const booking = serviceOrderDoc.booking_id;
  const customerClerkId = booking.customer_clerk_id;
  const statusLabel =
    SERVICE_ORDER_STATUS_LABELS[serviceOrderDoc.status] ||
    serviceOrderDoc.status;
  const orderNumber =
    serviceOrderDoc.orderNumber || serviceOrderDoc._id.toString();
  const plate = getPlate(booking);

  if (customerClerkId) {
    let customerTitle = `Đơn sửa chữa ${statusLabel}`;
    let customerMessage = `Lệnh ${orderNumber} hiện đã ${statusLabel}.`;
    let linkTo = `/booking/${booking._id}`;

    if (serviceOrderDoc.status === "servicing") {
      customerTitle = "Xe đang được sửa chữa";
      customerMessage = `Xe ${plate} của quý khách đang được sửa chữa/bảo dưỡng. Bấm vào đây để theo dõi tiến độ.`;
    } else if (serviceOrderDoc.status === "completed") {
      customerTitle = "Xe đã hoàn thành";
      let invoicePath = "/invoices";
      const invoice = await Invoice.findOne({
        service_order_id: serviceOrderDoc._id,
      })
        .select("_id")
        .lean();
      if (invoice?._id) {
        invoicePath = `/invoices/${invoice._id}`;
      }
      linkTo = invoicePath;
      customerMessage = `Xe ${plate} của quý khách đã hoàn thành. Quý khách vui lòng đến nhận xe tại cửa hàng. Bấm vào đây để xem hóa đơn chi tiết.`;
    }

    await createNotification({
      recipientClerkId: customerClerkId,
      recipientType: "customer",
      type: "SERVICE_ORDER_STATUS_UPDATED",
      title: customerTitle,
      message: customerMessage,
      linkTo,
      actorClerkId,
    });
  }

  const trimmedStatusLabel = (statusLabel || "").trim();
  const lowerStatus = trimmedStatusLabel.toLowerCase();
  const startsWithDa = lowerStatus.startsWith("đã ");
  const staffTitleStatus = startsWithDa
    ? trimmedStatusLabel
    : `đã ${trimmedStatusLabel}`;

  await notifyStaffGroup({
    type: "SERVICE_ORDER_STATUS_UPDATED",
    title: `Lệnh ${orderNumber} ${staffTitleStatus}`,
    message: `Trạng thái mới: ${trimmedStatusLabel}.`,
    linkTo: `/staff/service-order/${serviceOrderDoc._id}`,
    actorClerkId,
  });
}

async function notifyServiceOrderAlmostCompleted({
  serviceOrder,
  minutesLeft,
  variant = "15min",
}) {
  const serviceOrderDoc = await ensureServiceOrderContext(serviceOrder);
  if (!serviceOrderDoc?.booking_id) return;

  const booking = serviceOrderDoc.booking_id;
  const customerClerkId = booking.customer_clerk_id;
  const plate = getPlate(booking);
  const orderNumber =
    serviceOrderDoc.orderNumber || serviceOrderDoc._id.toString();
  const progressLink = `/booking/${booking._id}`;
  const staffLink = getStaffServiceOrderLink(serviceOrderDoc._id);

  // Customer luôn nhận thông báo ở cả 15' và 5'
  if (customerClerkId) {
    await createNotification({
      recipientClerkId: customerClerkId,
      recipientType: "customer",
      type: "SERVICE_ORDER_ALMOST_COMPLETED",
      title:
        minutesLeft <= 5
          ? "Sắp hoàn thành sửa xe (5 phút nữa)"
          : "Sắp hoàn thành sửa xe",
      message:
        minutesLeft <= 5
          ? `Xe ${plate} của quý khách dự kiến sẽ hoàn thành sửa chữa trong khoảng 5 phút nữa. Bấm vào đây để xem tiến độ chi tiết.`
          : `Xe ${plate} của quý khách dự kiến sẽ hoàn thành sửa chữa trong khoảng ${minutesLeft} phút nữa. Bấm vào đây để xem tiến độ chi tiết.`,
      linkTo: progressLink,
    });
  }

  // Staff chỉ nhận ở mốc 15 phút (theo yêu cầu)
  if (variant === "15min") {
    const customerName = await resolveCustomerName(customerClerkId);
    await notifyStaffGroup({
      type: "SERVICE_ORDER_ALMOST_COMPLETED",
      title: "Sắp hết thời gian sửa chữa",
      message: `Lệnh ${orderNumber} cho khách hàng ${customerName} (xe ${plate}) dự kiến sẽ hoàn thành trong khoảng ${minutesLeft} phút nữa.`,
      linkTo: staffLink,
      actorClerkId: customerClerkId,
    });
  }
}

async function notifyCustomerNewQuote(
  serviceOrder,
  quote,
  { isRevision = false } = {}
) {
  const serviceOrderDoc = await ensureServiceOrderContext(serviceOrder);
  if (!serviceOrderDoc?.booking_id) return;

  const booking = serviceOrderDoc.booking_id;
  const customerClerkId = booking.customer_clerk_id;
  if (!customerClerkId) return;
  const plate = getPlate(booking);
  const quoteLink = `/booking/${booking._id}/quotes`;

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "QUOTE_READY",
    title: isRevision ? "Báo giá đã được cập nhật" : "Báo giá mới đã sẵn sàng",
    message: isRevision
      ? "Thông tin báo giá đã được chỉnh sửa theo yêu cầu của quý khách. Bấm vào đây để xem và duyệt lại."
      : `Quý khách vui lòng duyệt hạng mục sửa chữa cho xe ${plate}. Bấm vào đây để duyệt ngay.`,
    linkTo: quoteLink,
    actorClerkId: serviceOrderDoc.staff_clerk_id || null,
  });
}

async function notifyQuoteApproved(serviceOrder, quote = null) {
  const serviceOrderDoc = await ensureServiceOrderContext(serviceOrder);
  if (!serviceOrderDoc?.booking_id) return;

  const booking = serviceOrderDoc.booking_id;
  const customerClerkId = booking.customer_clerk_id;
  if (!customerClerkId) return;

  const plate = getPlate(booking);
  const progressLink = `/booking/${booking._id}`;
  const customerName = await resolveCustomerName(customerClerkId);
  const staffLink = getStaffServiceOrderLink(serviceOrderDoc._id);
  const quoteCode = quote?._id ? getShortId(quote._id, 8) : "BÁO GIÁ";

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "QUOTE_APPROVED",
    title: "Đã xác nhận sửa chữa",
    message: `Quý khách đã duyệt hạng mục sửa chữa cho xe ${plate} thành công. Bấm vào đây để theo dõi tiến độ.`,
    linkTo: progressLink,
  });

  await notifyStaffGroup({
    type: "QUOTE_APPROVED",
    title: "Khách đã duyệt báo giá",
    message: `Báo giá ${quoteCode} của khách hàng ${customerName} đã được duyệt. Tiến hành triển khai sửa xe.`,
    linkTo: staffLink,
    actorClerkId: customerClerkId,
  });
}

async function notifyQuoteRevisionRequested(serviceOrder, quote = null) {
  const serviceOrderDoc = await ensureServiceOrderContext(serviceOrder);
  if (!serviceOrderDoc?.booking_id) return;

  const booking = serviceOrderDoc.booking_id;
  const customerClerkId = booking.customer_clerk_id;
  if (!customerClerkId) return;

  const quoteLink = `/booking/${booking._id}/quotes`;
  const customerName = await resolveCustomerName(customerClerkId);
  const staffLink = getStaffServiceOrderLink(serviceOrderDoc._id);
  const quoteCode = quote?._id ? getShortId(quote._id, 8) : "BÁO GIÁ";

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "QUOTE_REVISION_REQUESTED",
    title: "Đã gửi yêu cầu chỉnh báo giá",
    message:
      "Quý khách đã gửi yêu cầu chỉnh lại hạng mục sửa xe thành công. Xin vui lòng chờ cửa hàng cập nhật lại.",
    linkTo: quoteLink,
  });

  await notifyStaffGroup({
    type: "QUOTE_REVISION_REQUESTED",
    title: "Khách cần chỉnh báo giá",
    message: `${customerName} yêu cầu chỉnh báo giá ${quoteCode}. Vui lòng xem chi tiết & cập nhật.`,
    linkTo: staffLink,
    actorClerkId: customerClerkId,
  });
}

async function notifyWarrantyBookingSuccess({ booking, serviceOrderId }) {
  const bookingDoc = await ensureBookingContext(booking);
  if (!bookingDoc) return;
  const customerName = await resolveCustomerName(bookingDoc.customer_clerk_id);
  const bookingCode = getShortId(bookingDoc._id);

  await createNotification({
    recipientClerkId: bookingDoc.customer_clerk_id,
    recipientType: "customer",
    type: "WARRANTY_BOOKING_CONFIRMED",
    title: "Đặt lịch bảo hành thành công",
    message: `Quý khách ${customerName} đã đặt lịch bảo hành thành công. Vui lòng đợi cửa hàng xác nhận.`,
    linkTo: `/booking/${bookingDoc._id}`,
    actorClerkId: bookingDoc.customer_clerk_id,
  });

  if (serviceOrderId) {
    await notifyStaffGroup({
      type: "WARRANTY_BOOKING_CONFIRMED",
      title: "Có lịch bảo hành mới",
      message: `Khách hàng ${bookingCode} – ${customerName} đã đặt lịch bảo hành. Vui lòng xác nhận nhận việc.`,
      linkTo: STAFF_BOOKING_LIST_PATH,
      actorClerkId: bookingDoc.customer_clerk_id,
    });
  }
}

async function notifyPaymentSuccess(invoiceDoc, { actorClerkId = null } = {}) {
  if (!invoiceDoc) return;

  if (typeof invoiceDoc.populate === "function") {
    await invoiceDoc.populate({
      path: "service_order_id",
      populate: { path: "booking_id" },
    });
  }

  const serviceOrder = invoiceDoc.service_order_id;
  const booking = serviceOrder?.booking_id;
  const customerClerkId = booking?.customer_clerk_id || invoiceDoc.clerkId;
  const invoiceId = invoiceDoc._id.toString();
  const invoiceNumber = invoiceDoc.invoiceNumber || invoiceId;
  const receiptPath = `/invoices/${invoiceId}`;
  const formattedAmount = formatCurrency(
    invoiceDoc.paid_amount ?? invoiceDoc.amount
  );
  const customerName = await resolveCustomerName(customerClerkId);

  if (customerClerkId) {
    await createNotification({
      recipientClerkId: customerClerkId,
      recipientType: "customer",
      type: "PAYMENT_SUCCESSFUL",
      title: "Thanh toán thành công",
      message: `Đã nhận thanh toán ${formattedAmount} cho hóa đơn ${invoiceNumber}. Cảm ơn quý khách! Bấm vào đây để xem biên lai.`,
      linkTo: receiptPath,
      actorClerkId,
    });

    // Gửi email xác nhận thanh toán
    try {
      const { UsersService } = require("./users.service");
      const emailService = require("./email.service");

      console.log(
        "[Notification] Attempting to send payment confirmation email"
      );
      console.log("[Notification] customerClerkId:", customerClerkId);

      if (customerClerkId && !customerClerkId.startsWith("guest_")) {
        console.log("[Notification] Fetching customer profile...");
        const customerProfiles = await UsersService.getProfilesByIds([
          customerClerkId,
        ]);
        const customerProfile = customerProfiles[customerClerkId];

        console.log("[Notification] Customer profile:", {
          email: customerProfile?.email,
          fullName: customerProfile?.fullName,
        });

        if (customerProfile?.email) {
          // Chuyển đổi invoiceDoc thành object để truyền vào email service
          const invoiceData = {
            id: invoiceId,
            invoiceNumber,
            paid_amount: invoiceDoc.paid_amount ?? invoiceDoc.amount,
            amount: invoiceDoc.amount,
            payment_method: invoiceDoc.payment_method,
            confirmed_at: invoiceDoc.confirmed_at,
            updatedAt: invoiceDoc.updatedAt,
          };

          console.log(
            "[Notification] Sending payment confirmation email to:",
            customerProfile.email
          );
          await emailService.sendPaymentConfirmationEmail(
            invoiceData,
            customerProfile.email,
            customerName
          );
          console.log(
            "[Notification] Payment confirmation email sent successfully"
          );
        } else {
          console.log(
            "[Notification] Customer has no email address, skipping email"
          );
        }
      } else {
        console.log(
          "[Notification] Invalid customerClerkId or guest user, skipping email"
        );
      }
    } catch (error) {
      console.error(
        "[Notification] Failed to send payment confirmation email:",
        error
      );
      console.error("[Notification] Error stack:", error.stack);
      // Không throw error để không làm gián đoạn flow
    }
  }

  await notifyStaffGroup({
    type: "PAYMENT_CONFIRMED",
    title: "Đã xác nhận thanh toán",
    message: `${invoiceNumber} của khách hàng ${customerName} đã thanh toán đủ. Hẹn giờ giao xe với khách.`,
    linkTo: `/staff/invoices/${invoiceId}`,
    actorClerkId,
  });
}

async function notifyCustomerChatMessage(customerClerkId, message) {
  if (!customerClerkId || customerClerkId.startsWith("guest_")) return;

  await createNotification({
    recipientClerkId: customerClerkId,
    recipientType: "customer",
    type: "CHAT_MESSAGE",
    title: "Bạn có tin nhắn mới",
    message:
      message?.content?.slice(0, 80) ||
      "Nhân viên vừa gửi cho bạn một tin nhắn mới.",
    linkTo: "/#chat",
  });
}

async function notifyStaffChatMessage(customerId, message) {
  await notifyStaffGroup({
    type: "CHAT_MESSAGE",
    title: "Khách hàng vừa gửi tin nhắn",
    message:
      message?.content?.slice(0, 80) ||
      `Khách hàng ${customerId} vừa gửi một tin nhắn mới.`,
    linkTo: "/staff/chat",
    actorClerkId: customerId,
  });
}

async function getNotificationsByRecipient(recipientClerkId, query = {}) {
  const {
    page = 1,
    limit = 5,
    isRead, // Thêm isRead
  } = query;

  if (!recipientClerkId) {
    throw new Error("Recipient Clerk ID is required.");
  }

  try {
    const filter = { recipientClerkId: recipientClerkId };
    const sort = { createdAt: -1 };

    if (isRead === "false") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(filter);

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
}

async function getUnreadNotificationCount(recipientClerkId) {
  if (!recipientClerkId) {
    throw new Error("Recipient Clerk ID is required.");
  }

  try {
    const count = await Notification.countDocuments({
      recipientClerkId: recipientClerkId,
      isRead: false,
    });
    return count;
  } catch (error) {
    throw new Error(
      `Failed to get unread notification count: ${error.message}`
    );
  }
}

async function markNotificationsAsRead(recipientClerkId, notificationIds) {
  if (
    !recipientClerkId ||
    !notificationIds ||
    !Array.isArray(notificationIds) ||
    notificationIds.length === 0
  ) {
    throw new Error("Recipient ID and notification IDs array are required.");
  }

  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipientClerkId: recipientClerkId,
      },
      { $set: { isRead: true } }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
}

async function markAllAsRead(recipientClerkId) {
  if (!recipientClerkId) {
    throw new Error("Recipient Clerk ID is required.");
  }

  try {
    const result = await Notification.updateMany(
      {
        recipientClerkId: recipientClerkId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );
    return result;
  } catch (error) {
    throw new Error(
      `Failed to mark all notifications as read: ${error.message}`
    );
  }
}

module.exports = {
  notifyAllStaffOfNewComplaint,
  notifyCustomerOnReply,
  notifyCustomerComplaintSubmitted,
  notifyPasswordChanged,
  notifyStaffOfNewBooking,
  notifyCustomerBookingCreated,
  notifyCustomerBookingCancelled,
  notifyStaffOfBookingCancelled,
  notifyServiceOrderStatusChange,
  notifyCustomerNewQuote,
  notifyQuoteApproved,
  notifyQuoteRevisionRequested,
  notifyWarrantyBookingSuccess,
  notifyPaymentSuccess,
  notifyCustomerChatMessage,
  notifyStaffChatMessage,
  getNotificationsByRecipient,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  markAllAsRead,
  createNotification,
  isStaffUser,
  notifyStaffGroup,
};
