const DomainError = require("../errors/domainError");
const {
  ServicesService,
  mapServiceToDTO,
  ERROR_CODES: SERVICE_ERROR_CODES,
} = require("./services.service");
const { VehiclesService, mapToVehicleDTO } = require("./vehicles.service");
const { UsersService } = require("./users.service");
const ServiceOrderService = require("./service_order.service");
const config = require("./config");
const { Booking } = require("../model");
const notificationService = require("./notification.service");

const ERROR_CODES = {
  BOOKINGS_INVALID_TIME_SLOT: "BOOKINGS_INVALID_TIME_SLOT",
  BOOKINGS_STATE_INVALID: "BOOKINGS_STATE_INVALID",
  BOOKINGS_VEHICLE_ALREADY_BOOKED: "BOOKINGS_VEHICLE_ALREADY_BOOKED",
  BOOKINGS_NOT_FOUND: "BOOKINGS_NOT_FOUND",
};

function convertTimeSlotToDate(timeSlot) {
  const { day, month, year, hours, minutes } = timeSlot;
  return new Date(year, month - 1, day, hours, minutes);
}

class BookingsService {
  async createBooking(customerClerkId, vehicleId, serviceIds, timeSlot) {
    await VehiclesService.verifyVehicleOwnership(vehicleId, customerClerkId);

    const activeBookingsMap = await VehiclesService.getActiveBookingsMap([
      vehicleId,
    ]);
    if (vehicleId in activeBookingsMap) {
      throw new DomainError(
        "Người dùng đã có đơn dịch vụ cho phương tiện này",
        ERROR_CODES.BOOKINGS_VEHICLE_ALREADY_BOOKED,
        409
      );
    }

    const uniqueServiceIds = [...new Set(serviceIds)];
    const validServiceIds = await ServicesService.getValidServiceIds(
      uniqueServiceIds
    );
    if (validServiceIds.length === 0) {
      throw new DomainError(
        "Một hoặc nhiều dịch vụ không hợp lệ",
        SERVICE_ERROR_CODES.SERVICE_NOT_FOUND,
        404
      );
    }

    const timeSlotStart = convertTimeSlotToDate(timeSlot);
    if (timeSlotStart.getTime() % config.TIMESLOT_INTERVAL_MILLISECONDS !== 0) {
      throw new DomainError(
        "Khung thời gian không hợp lệ",
        ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
        400
      );
    }

    const timeSlotEnd = new Date(
      timeSlotStart.getTime() + config.TIMESLOT_INTERVAL_MILLISECONDS
    );

    const isAvailable = await this.isTimeslotAvailable(
      timeSlotStart,
      timeSlotEnd
    );
    if (!isAvailable) {
      throw new DomainError(
        "Slot không khả dụng",
        ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
        400
      );
    }

    const booking = new Booking({
      customer_clerk_id: customerClerkId,
      vehicle_id: vehicleId,
      service_ids: serviceIds,
      slot_start_time: timeSlotStart,
      slot_end_time: timeSlotEnd,
      status: "booked",
    });

    await booking.save();

    await Promise.all([
      notificationService.notifyStaffOfNewBooking(booking),
      notificationService.notifyCustomerBookingCreated(booking),
    ]);

    return booking;
  }

  async isTimeslotAvailable(slotStartTime, slotEndTime) {
    const now = new Date();
    if (slotStartTime < now) {
      return false;
    }

    const overlapCount = await this.getOverlappingBookingsCount(
      slotStartTime,
      slotEndTime
    );

    return overlapCount < config.MAX_BOOKINGS_PER_SLOT;
  }

  async getOverlappingBookingsCount(slotStartTime, slotEndTime) {
    const count = await Booking.countDocuments({
      slot_start_time: { $lt: slotEndTime },
      slot_end_time: { $gt: slotStartTime },
      status: "booked",
    }).exec();

    return count;
  }

  async getTimeSlotsForDMY(day, month, year) {
    const timeSlots = [];
    const startHour = config.BUSINESS_START_HOUR;
    const endHour = config.BUSINESS_END_HOUR;

    const interval = config.TIMESLOT_INTERVAL_MINUTES;
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slot = {
          day,
          month,
          year,
          hours: hour,
          minutes: minute,
        };

        const slotStart = convertTimeSlotToDate(slot);
        const slotEnd = new Date(
          slotStart.getTime() + config.TIMESLOT_INTERVAL_MILLISECONDS
        );

        const isAvailable = await this.isTimeslotAvailable(slotStart, slotEnd);
        timeSlots.push({ ...slot, isAvailable });
      }
    }

    return timeSlots;
  }

  async getBookingById(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate("service_ids")
      .populate({
        path: "vehicle_id",
        populate: { path: "model_id" },
      })
      .populate("service_order_id")
      .exec();

    if (!booking) {
      return null;
    }

    const userMap = await UsersService.getFullNamesByIds([
      booking.customer_clerk_id,
    ]);

    // Lấy thời gian check-in: service order được tạo khi check-in xe
    // Nếu có service order thì dùng service_order.createdAt làm thời gian check-in
    // Nếu không có service order (chưa check-in) thì dùng booking.createdAt
    const checkedInAt =
      booking.service_order_id?.createdAt || booking.createdAt;

    return {
      id: booking._id,
      customer: {
        customerClerkId: booking.customer_clerk_id,
        customerName: userMap[booking.customer_clerk_id],
      },
      vehicle: mapToVehicleDTO(booking.vehicle_id),
      services: booking.service_ids.map(mapServiceToDTO),
      slotStartTime: booking.slot_start_time,
      slotEndTime: booking.slot_end_time,
      status: booking.status,
      serviceOrderStatus: booking.service_order_id?.status || null,
      serviceOrderId: booking.service_order_id?._id || null,
      serviceOrderNumber: booking.service_order_id?.orderNumber || null,
      createdAt: booking.createdAt,
      checkedInAt: checkedInAt, // Thời gian check-in xe (thời gian tạo đơn thực tế)
    };
  }

  async getUserBookings(customerClerkId, options = {}) {
    const { limit = null, skip = 0 } = options;

    // Tối ưu: chỉ select các fields cần thiết và populate hiệu quả
    let query = Booking.find({ customer_clerk_id: customerClerkId })
      .select(
        "_id slot_start_time slot_end_time status service_order_id service_ids vehicle_id"
      )
      .populate({
        path: "service_ids",
        select: "_id name price description", // Chỉ lấy các field cần thiết của service
      })
      .populate({
        path: "vehicle_id",
        select: "_id license_plate brand name year model_id", // Chỉ lấy các field cần thiết của vehicle
        populate: {
          path: "model_id",
          select: "_id name brand", // Chỉ lấy các field cần thiết của model
        },
      })
      .populate({
        path: "service_order_id",
        select: "_id orderNumber", // Lấy orderNumber từ service order
      })
      .lean() // Sử dụng lean() để tăng performance, trả về plain JavaScript objects
      .skip(skip);

    if (limit) {
      query = query.limit(limit);
    }

    const bookings = await query.exec();

    // Map và sắp xếp: đang thực hiện lên đầu, sau đó sắp xếp theo thời gian giảm dần
    const mappedBookings = bookings.map((booking) => ({
      id: booking._id,
      vehicle: mapToVehicleDTO(booking.vehicle_id),
      services: booking.service_ids
        ? booking.service_ids.map(mapServiceToDTO)
        : [],
      slotStartTime: booking.slot_start_time,
      slotEndTime: booking.slot_end_time,
      status: booking.status,
      serviceOrderId: booking.service_order_id?._id || booking.service_order_id || null,
      serviceOrderNumber: booking.service_order_id?.orderNumber || null,
    }));

    // Sắp xếp: đang thực hiện (in_progress, checked_in) lên đầu, sau đó theo thời gian giảm dần
    const activeStatuses = ["in_progress", "checked_in"];
    mappedBookings.sort((a, b) => {
      const aIsActive = activeStatuses.includes(a.status);
      const bIsActive = activeStatuses.includes(b.status);

      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Cùng trạng thái, sắp xếp theo thời gian giảm dần
      const timeA = a.slotStartTime ? new Date(a.slotStartTime).getTime() : 0;
      const timeB = b.slotStartTime ? new Date(b.slotStartTime).getTime() : 0;
      return timeB - timeA;
    });

    return mappedBookings;
  }

  async getAllBookingsSortedDescending({
    page = 1,
    limit = 20,
    customerName = null,
    status = null,
    startTimestamp = null,
    endTimestamp = null,
  }) {
    const filters = {};

    if (customerName) {
      console.log("Searching bookings for customer name:", customerName);
      const customerIds = await UsersService.getUserIdsByFullName(customerName);
      if (customerIds.length === 0) {
        return {
          bookings: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
        };
      }
      filters.customer_clerk_id = { $in: customerIds };
    }

    if (status) {
      filters.status = status;
    }

    if (startTimestamp) {
      filters.createdAt = { $gte: new Date(startTimestamp) };
    }

    if (endTimestamp) {
      if (filters.createdAt) {
        filters.createdAt.$lte = new Date(endTimestamp);
      } else {
        filters.createdAt = { $lte: new Date(endTimestamp) };
      }
    }

    // Custom sort priority:
    // 0 - booked (Đã đặt)
    // 1 - checked_in/in_progress (Đã tiếp nhận)
    // 2 - cancelled (Đã hủy)
    // 3 - others (completed, etc.)
    const [bookings, totalItems] = await Promise.all([
      Booking.aggregate([
        { $match: filters },
        {
          $addFields: {
            sortPriority: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "booked"] }, then: 0 },
                  {
                    case: {
                      $or: [
                        { $eq: ["$status", "checked_in"] },
                        { $eq: ["$status", "in_progress"] },
                      ],
                    },
                    then: 1,
                  },
                  { case: { $eq: ["$status", "cancelled"] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
        { $sort: { sortPriority: 1, slot_start_time: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "services",
            localField: "service_ids",
            foreignField: "_id",
            as: "service_ids",
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle_id",
            foreignField: "_id",
            as: "vehicle_id",
          },
        },
        {
          $lookup: {
            from: "service_orders",
            localField: "service_order_id",
            foreignField: "_id",
            as: "service_order_id",
          },
        },
        {
          $addFields: {
            vehicle_id: { $arrayElemAt: ["$vehicle_id", 0] },
            service_ids: "$service_ids",
            service_order_id: { $arrayElemAt: ["$service_order_id", 0] },
          },
        },
      ]).exec(),
      Booking.countDocuments(filters).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const customerIds = bookings.map((b) => b.customer_clerk_id.toString());
    const userMap = await UsersService.getFullNamesByIds(customerIds);

    return {
      bookings: bookings.map((booking) => ({
        id: booking._id,
        customerName: userMap[booking.customer_clerk_id.toString()],
        services: booking.service_ids.map((s) => s.name),
        slotStartTime: booking.slot_start_time,
        slotEndTime: booking.slot_end_time,
        status: booking.status,
        serviceOrderId: booking.service_order_id?._id || booking.service_order_id || null,
        serviceOrderNumber: booking.service_order_id?.orderNumber || null,
        createdAt: booking.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  async checkInBooking(staffId, bookingId) {
    // Dùng update có điều kiện để tránh race-condition khi nhiều staff cùng thao tác
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "booked" },
      { $set: { status: "checked_in" } },
      { new: true }
    ).exec();

    if (!booking) {
      // Hoặc booking không tồn tại, hoặc trạng thái không còn là "booked" nữa
      const exists = await Booking.exists({ _id: bookingId }).exec();
      if (!exists) {
        throw new DomainError(
          "Booking không tồn tại",
          ERROR_CODES.BOOKINGS_NOT_FOUND,
          404
        );
      }

      // Trạng thái đã bị người khác thay đổi (vd: đã check-in / hủy)
      throw new DomainError(
        "Booking đã được cập nhật bởi nhân viên khác. Vui lòng làm mới trang.",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        409
      );
    }

    const serviceOrder =
      await ServiceOrderService.createServiceOrderFromBooking(
        staffId,
        bookingId
      );

    booking.service_order_id = serviceOrder._id;
    await booking.save();

    return booking;
  }

  async cancelBooking(bookingId, userId, cancelReason = null) {
    const booking = await Booking.findById(bookingId)
      .populate("service_order_id")
      .exec();
    if (!booking) {
      throw new DomainError(
        "Booking không tồn tại",
        ERROR_CODES.BOOKINGS_NOT_FOUND,
        404
      );
    }

    if (booking.status === "completed") {
      throw new DomainError(
        "Không thể hủy booking đã hoàn thành",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        400
      );
    }

    if (booking.status === "cancelled") {
      throw new DomainError(
        "Booking đã bị hủy trước đó",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        400
      );
    }

    // Determine if user is staff or customer
    const isStaff = await notificationService.isStaffUser(userId);
    const cancelledBy = isStaff ? "staff" : "customer";

    // Nếu đã check-in (đã tạo service order), hủy service order trước
    if (booking.service_order_id) {
      const serviceOrder = booking.service_order_id;
      // Chỉ hủy service order nếu chưa hoàn thành và chưa bị hủy
      if (
        serviceOrder.status !== "completed" &&
        serviceOrder.status !== "cancelled"
      ) {
        serviceOrder.status = "cancelled";
        serviceOrder.cancelled_by = cancelledBy;
        serviceOrder.cancel_reason =
          cancelReason ||
          (cancelledBy === "customer"
            ? "Khách hàng hủy đơn sau khi đã check-in"
            : "Nhân viên hủy đơn sau khi đã check-in");
        serviceOrder.cancelled_at = new Date();
        await serviceOrder.save();
      }
    }

    // Cập nhật trạng thái booking thành cancelled
    booking.status = "cancelled";
    booking.cancelled_by = cancelledBy;
    booking.cancel_reason = cancelReason || null;
    booking.cancelled_at = new Date();
    await booking.save();

    await Promise.all([
      notificationService.notifyCustomerBookingCancelled(booking),
      notificationService.notifyStaffOfBookingCancelled(booking),
    ]);

    return booking;
  }
}

module.exports = new BookingsService();
