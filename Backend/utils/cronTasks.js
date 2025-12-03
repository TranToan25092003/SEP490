const { Test, ServiceOrder, Booking, ServiceOrderTask } = require("../model");
const notificationService = require("../service/notification.service");
const { UsersService } = require("../service/users.service");
const serviceOrderService = require("../service/service_order.service");
const bookingsService = require("../service/bookings.service");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

async function healthCheck() {
  try {
    await Test.find({});
    console.log("System is healthy 💪💪💪");
  } catch (error) {
    console.error("Health check failed:", error);
  }
}

async function getCustomerName(clerkId) {
  if (!clerkId) return "Quý khách";
  const map = await UsersService.getFullNamesByIds([clerkId]);
  const name = map?.[clerkId];
  return name && name !== "Không có tên" ? name : "Quý khách";
}

async function sendMaintenanceReminders() {
  const now = Date.now();
  const ninetyDaysAgo = new Date(now - 90 * DAY_IN_MS);
  const sixtyDaysAgo = new Date(now - 60 * DAY_IN_MS);

  const filters = {
    status: "completed",
    completed_at: { $gte: ninetyDaysAgo, $lte: sixtyDaysAgo },
    $or: [
      { maintenance_reminder_sent_at: { $exists: false } },
      { maintenance_reminder_sent_at: null },
    ],
  };

  const serviceOrders = await ServiceOrder.find(filters)
    .limit(50)
    .populate({
      path: "booking_id",
      populate: { path: "vehicle_id" },
    })
    .exec();

  await Promise.all(
    serviceOrders.map(async (order) => {
      const booking = order.booking_id;
      const customerClerkId = booking?.customer_clerk_id;
      if (!customerClerkId) return;

      const plate = booking.vehicle_id?.license_plate || "xe của bạn";
      const customerName = await getCustomerName(customerClerkId);
      const bookingLink = "/booking";

      await notificationService.createNotification({
        recipientClerkId: customerClerkId,
        recipientType: "customer",
        type: "MAINTENANCE_REMINDER",
        title: "Đến lúc kiểm tra xe định kỳ",
        message: `Kính gửi Quý khách ${customerName}, đã đến kỳ bảo dưỡng định kỳ cho xe ${plate}. Để bảo đảm an toàn vận hành, kính mời đặt lịch tại ${bookingLink}.`,
        linkTo: bookingLink,
      });

      order.maintenance_reminder_sent_at = new Date();
      await order.save();
    })
  );
}

/**
 * Tự động hủy service order nếu khách hàng không confirm báo giá trong vòng 1 tiếng
 */
async function autoCancelUnapprovedServiceOrders() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 tiếng trước

    // Tìm các service order đang chờ khách hàng xác nhận quá 1 tiếng
    const unapprovedOrders = await ServiceOrder.find({
      status: "waiting_customer_approval",
      waiting_approval_at: { $exists: true, $lte: oneHourAgo },
    })
      .populate("booking_id")
      .exec();

    console.log(
      `[Auto Cancel] Found ${unapprovedOrders.length} unapproved service orders to cancel`
    );

    await Promise.all(
      unapprovedOrders.map(async (order) => {
        try {
          // Hủy service order
          await serviceOrderService.cancelServiceOrder(
            order._id.toString(),
            order.staff_clerk_id || "system",
            "Tự động hủy do khách hàng không xác nhận báo giá trong vòng 1 tiếng"
          );
          console.log(`[Auto Cancel] Cancelled service order ${order._id}`);
        } catch (error) {
          console.error(
            `[Auto Cancel] Error cancelling service order ${order._id}:`,
            error.message
          );
        }
      })
    );
  } catch (error) {
    console.error(
      "[Auto Cancel] Error in autoCancelUnapprovedServiceOrders:",
      error
    );
  }
}

/**
 * Tự động hủy booking nếu quá giờ đặt 30 phút mà chưa check in
 */
async function autoCancelUncheckedInBookings() {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 phút trước

    // Tìm các booking đã quá giờ đặt 30 phút mà chưa check in
    const uncheckedBookings = await Booking.find({
      status: "booked", // Chỉ hủy các booking còn ở trạng thái "booked"
      slot_start_time: { $lte: thirtyMinutesAgo }, // Đã quá giờ đặt 30 phút
    }).exec();

    console.log(
      `[Auto Cancel] Found ${uncheckedBookings.length} unchecked bookings to cancel`
    );

    await Promise.all(
      uncheckedBookings.map(async (booking) => {
        try {
          // Hủy booking
          await bookingsService.cancelBooking(
            booking._id.toString(),
            "staff",
            "Tự động hủy do quá giờ đặt 30 phút mà chưa được check in"
          );
          console.log(`[Auto Cancel] Cancelled booking ${booking._id}`);
        } catch (error) {
          console.error(
            `[Auto Cancel] Error cancelling booking ${booking._id}:`,
            error.message
          );
        }
      })
    );
  } catch (error) {
    console.error(
      "[Auto Cancel] Error in autoCancelUncheckedInBookings:",
      error
    );
  }
}

/**
 * Gửi thông báo cho toàn bộ staff khi sắp đến giờ sửa (trước 10 phút)
 */
async function notifyUpcomingServiceTasks() {
  try {
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

    // Chỉ lấy các task đã được xếp lịch, chưa bắt đầu
    const upcomingTasks = await ServiceOrderTask.find({
      status: "scheduled",
      expected_start_time: {
        $gt: now,
        $lte: tenMinutesLater,
      },
    })
      .populate({
        path: "service_order_id",
        populate: {
          path: "booking_id",
          populate: { path: "vehicle_id" },
        },
      })
      .exec();

    if (!upcomingTasks.length) {
      return;
    }

    console.log(
      `[Cron] Found ${upcomingTasks.length} upcoming service tasks within 10 minutes`
    );

    await Promise.all(
      upcomingTasks.map(async (task) => {
        const serviceOrder = task.service_order_id;
        if (!serviceOrder) return;

        const booking = serviceOrder.booking_id;
        const plate = booking?.vehicle_id?.license_plate || "không xác định";
        const orderNumber =
          serviceOrder.orderNumber || serviceOrder._id.toString();

        await notificationService.notifyStaffGroup({
          type: "UPCOMING_SERVICE_TASK",
          title: "Sắp đến giờ sửa xe",
          message: `Lệnh ${orderNumber} cho xe ${plate} sẽ bắt đầu trong vòng 10 phút. Vui lòng chuẩn bị bay và nhân sự.`,
          linkTo: `/staff/service-order/${serviceOrder._id}`,
          actorClerkId: serviceOrder.staff_clerk_id || null,
        });
      })
    );
  } catch (error) {
    console.error("[Cron] Error in notifyUpcomingServiceTasks:", error);
  }
}

const runCronTasks = async () => {
  try {
    await Promise.all([
      healthCheck(),
      sendMaintenanceReminders(),
      autoCancelUnapprovedServiceOrders(),
      autoCancelUncheckedInBookings(),
      notifyUpcomingServiceTasks(),
    ]);
  } catch (error) {
    console.error("Error in cron tasks:", error);
  }
};

module.exports = { runCronTasks };
