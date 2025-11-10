const DomainError = require("../errors/domainError");
const { ServicesService, mapServiceToDTO, ERROR_CODES: SERVICE_ERROR_CODES } = require("./services.service");
const { VehiclesService, mapToVehicleDTO } = require("./vehicles.service");
const { UsersService } = require("./users.service");
const ServiceOrderService = require("./service_order.service");
const config = require("./config");
const { Booking } = require("../model");

const ERROR_CODES = {
  BOOKINGS_INVALID_TIME_SLOT: "BOOKINGS_INVALID_TIME_SLOT",
  BOOKINGS_STATE_INVALID: "BOOKINGS_STATE_INVALID",
  BOOKINGS_VEHICLE_ALREADY_BOOKED: "BOOKINGS_VEHICLE_ALREADY_BOOKED",
};

/**
 * Utility to convert a time slot object to a Date.
 * @param {import("./types").Timeslot} timeSlot
 * @returns {Date}
 */
function convertTimeSlotToDate(timeSlot) {
  const { day, month, year, hours, minutes } = timeSlot;
  return new Date(year, month - 1, day, hours, minutes);
}

class BookingsService {
  /**
   * Create a new booking.
   * @param {string} customerClerkId - ID of the customer creating the booking.
   * @param {string} vehicleId - ID of the vehicle for the booking.
   * @param {Array<string>} serviceIds - Array of service IDs to be included in the booking.
   * @param {import("./types").Timeslot} timeSlot - Object representing the desired time slot for the booking.
   * @returns {Promise<Booking>} - The created booking object.
   * @throws {DomainError} - If there is a domain-specific error during booking creation.
   * @example
   * const booking = await bookingsService.createBooking(
   * "user123",
   * "vehicle123",
   * ["service1", "service2"],
   * { day: 15, month: 8, year: 2024, hours: 10, minutes: 30 }
   * );
   * console.log(booking);
   */
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

    const isAvailable = await this._isTimeslotAvailable(timeSlotStart, timeSlotEnd);
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

  /**
   * Get available time slots for a specific day.
   * @param {number} day
   * @param {number} month
   * @param {number} year
   * @returns {Promise<Array<import("./types").TimeslotWithAvailability>>}
   */
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

  /**
   * Get booking by ID.
   * @param {string} bookingId
   * @returns {Promise<import("./types").BookingDTO | null>}
   */
  async getBookingById(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate("service_ids")
      .populate("vehicle_id")
      .exec();

    if (!booking) {
      return null;
    }

    const userMap = await UsersService.getFullNamesByIds([booking.customer_clerk_id]);

    return {
      id: booking._id,
      customer: {
        customerClerkId: booking.customer_clerk_id,
        customerName: userMap[booking.customer_clerk_id]
      },
      vehicle: mapToVehicleDTO(booking.vehicle_id),
      services: booking.service_ids.map(mapServiceToDTO),
      slotStartTime: booking.slot_start_time,
      slotEndTime: booking.slot_end_time,
      status: booking.status,
      serviceOrderId: booking.service_order_id,
    };
  }

  /**
   * Get all bookings sorted by start time.
   * @returns {Promise<Array<import("./types").BookingDTO>>}
   */
  async getAllBookingsSortedAscending() {
    const bookings = await Booking.find()
      .populate("service_ids")
      .populate("vehicle_id")
      .sort({ slot_start_time: 1 })
      .exec();

    const customerIds = bookings.map(b => b.customer_clerk_id.toString());
    const userMap = await UsersService.getFullNamesByIds(customerIds);

    return bookings.map(booking => ({
      id: booking._id,
      customerName: userMap[booking.customer_clerk_id.toString()],
      services: booking.service_ids.map(s => s.name),
      slotStartTime: booking.slot_start_time,
      slotEndTime: booking.slot_end_time,
      status: booking.status,
      serviceOrderId: booking.service_order_id,
    }));
  }

  /**
   * Calls this when customer arrives for their booking
   * to begin the service.
   * @param {String} staffId - Clerk ID of the staff checking in the booking
   * @param {String} bookingId - ID of the booking to check in
   * @returns {Promise<Booking>} - The updated booking object.
   * @throws {DomainError} - If booking not found or invalid state.
   */
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

    return booking;
  }

  /**
   * Cancel a booking.
   * @param {string} bookingId
   * @returns {Promise<Booking>}
   */
  async cancelBooking(bookingId) {
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

    booking.status = "cancelled";
    await booking.save();

    return booking;
  }
}

module.exports = new BookingsService();
