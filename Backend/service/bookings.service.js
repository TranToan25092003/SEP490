const DomainError = require("../errors/domainError");
const { ServicesService, ERROR_CODES: SERVICE_ERROR_CODES } = require("./services.service");
const vehiclesService = require("./vehicles.service");
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
 * @param {{
 *  day: number,
 *  month: number,
 *  year: number,
 *  hours: number,
 *  minutes: number
 * }} timeSlot
 * @returns {Date}
 */
function convertTimeSlotToDate(timeSlot) {
  const { day, month, year, hours, minutes } = timeSlot;
  return new Date(year, month - 1, day, hours, minutes);
}

function mapToBookingDTO(booking) {
  return {
    id: booking._id,
    customerClerkId: booking.customer_clerk_id,
    vehicleId: booking.vehicle_id,
    serviceIds: booking.service_ids,
    slotStartTime: booking.slot_start_time,
    slotEndTime: booking.slot_end_time,
    status: booking.status,
    serviceOrderId: booking.service_order_id
  };
}

class BookingsService {
  /**
   * Create a new booking.
   * @param {string} customerClerkId - ID of the customer creating the booking.
   * @param {string} vehicleId - ID of the vehicle for the booking.
   * @param {Array<string>} serviceIds - Array of service IDs to be included in the booking.
   * @param {Object} timeSlot - Object representing the desired time slot for the booking.
   * @returns {Object} - The created booking object.
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
    const vehicleIdsInUse = await vehiclesService.getVehiclesInUse([vehicleId]);
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

    return mapToBookingDTO(booking);
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
   * @returns {Promise<Array<{ hours: number, minutes: number, day: number, month: number, year: number, isAvailable: boolean }>>}
   */
  async getTimeSlotsForDMY(day, month, year) {
    const timeSlots = [];
    const startHour = 8;
    const endHour = 17;

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

  /*
   * Calls this when customer arrives for their booking
   * to begin the service.
   * @param {String} staffId - Clerk ID of the staff checking in the booking
   * @param {String} bookingId - ID of the booking to check in
   * @returns {Object} - The updated booking object.
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

    return mapToBookingDTO(booking);
  }

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

    return mapToBookingDTO(booking);
  }
}

module.exports = new BookingsService();
