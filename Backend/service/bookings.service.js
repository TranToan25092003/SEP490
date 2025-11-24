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
};

function convertTimeSlotToDate(timeSlot) {
  const { day, month, year, hours, minutes } = timeSlot;
  return new Date(year, month - 1, day, hours, minutes);
}

class BookingsService {
  async createBooking(customerClerkId, vehicleId, serviceIds, timeSlot) {
    const vehicleIdsInUse = await VehiclesService.getVehiclesInUse([vehicleId]);
    if (vehicleIdsInUse.includes(vehicleId)) {
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

    const isAvailable = await this._isTimeslotAvailable(
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

  async _isTimeslotAvailable(slotStartTime, slotEndTime) {
    const now = new Date();
    if (slotStartTime < now) {
      return false;
    }

    const overlapCount = await this._getOverlappingBookingsCount(
      slotStartTime,
      slotEndTime
    );

    return overlapCount < config.MAX_BOOKINGS_PER_SLOT;
  }

  async _getOverlappingBookingsCount(slotStartTime, slotEndTime) {
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

        const isAvailable = await this._isTimeslotAvailable(slotStart, slotEnd);
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
    };
  }

  async getUserBookings(customerClerkId) {
    // Tối ưu: chỉ select các fields cần thiết và populate hiệu quả
    const bookings = await Booking.find({ customer_clerk_id: customerClerkId })
      .select("_id slot_start_time slot_end_time status service_order_id service_ids vehicle_id")
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
      .sort({ slot_start_time: -1 })
      .lean() // Sử dụng lean() để tăng performance, trả về plain JavaScript objects
      .exec();

    return bookings.map((booking) => ({
      id: booking._id,
      vehicle: mapToVehicleDTO(booking.vehicle_id),
      services: booking.service_ids ? booking.service_ids.map(mapServiceToDTO) : [],
      slotStartTime: booking.slot_start_time,
      slotEndTime: booking.slot_end_time,
      status: booking.status,
      serviceOrderId: booking.service_order_id,
    }));
  }

  async getAllBookingsSortedAscending({
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

    // Custom sort: completed status goes to bottom, others sorted by slot_start_time ascending
    const [bookings, totalItems] = await Promise.all([
      Booking.aggregate([
        { $match: filters },
        {
          $addFields: {
            sortPriority: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          }
        },
        { $sort: { sortPriority: 1, slot_start_time: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "services",
            localField: "service_ids",
            foreignField: "_id",
            as: "service_ids"
          }
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle_id",
            foreignField: "_id",
            as: "vehicle_id"
          }
        },
        {
          $addFields: {
            vehicle_id: { $arrayElemAt: ["$vehicle_id", 0] },
            service_ids: "$service_ids"
          }
        }
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
        serviceOrderId: booking.service_order_id,
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
    const booking = await Booking.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Booking không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    if (booking.status !== "booked") {
      throw new DomainError(
        "Chỉ có thể check-in các booking ở trạng thái 'booked'",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        400
      );
    }

    await ServiceOrderService._createServiceOrderFromBooking(
      staffId,
      bookingId
    );

    booking.status = "checked_in";
    await booking.save();

    return booking;
  }

  async cancelBooking(bookingId, userId, cancelReason = null) {
    const booking = await Booking.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Booking không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    if (booking.status !== "booked") {
      throw new DomainError(
        "Chỉ có thể hủy các booking ở trạng thái 'booked'",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        400
      );
    }

    // Determine if user is staff or customer
    const isStaff = await notificationService.isStaffUser(userId);
    const cancelledBy = isStaff ? "staff" : "customer";

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
