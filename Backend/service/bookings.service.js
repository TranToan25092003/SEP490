const DomainError = require("../errors/domainError");
const { Service, ServiceOrder } = require("../model");
const ServicesService = require("./services.service");

const ERROR_CODES = {
  BOOKINGS_SERVICE_NOT_FOUND: "BOOKINGS_SERVICE_NOT_FOUND",
  BOOKINGS_INVALID_TIME_SLOT: "BOOKINGS_INVALID_TIME_SLOT",
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

/**
 * Check if the booking date is valid.
 * @param {Date} bookingDate
 * @returns {[boolean, string]} - Returns a tuple where the first element indicates validity and the second element is an error message if invalid.
 */
async function isBookingDateValid(bookingDate) {
  const now = new Date();
  if (bookingDate < now) {
    return [false, "Thời gian đặt lịch muộn hơn hiện tại"];
  }
  return [true, ""];
}

/**
 * Find an available bay for the given booking date.
 * @param {Date} bookingDate
 */
async function findAvailableBay(bookingDate) {
  // TODO: Implement bay availability logic
  return null;
}

class BookingsService {
  /**
   * Create a new booking.
   * @param {string} creatorId - ID of the user creating the booking.
   * @param {string} userIdToBookFor - ID of the user for whom the booking is made.
   * @param {string} vehicleId - ID of the vehicle for the booking.
   * @param {Array<string>} serviceIds - Array of service IDs to be included in the booking.
   * @param {Object} timeSlot - Object representing the desired time slot for the booking.
   * @returns {Object} - The created booking object.
   * @throws {DomainError} - If there is a domain-specific error during booking creation.
   * @example - Creating a booking by a user for another user
   * const booking = await bookingsService.createBooking(
   *  "user123",
   *  "user456",
   *  "vehicle123",
   *  ["service1", "service2"],
   *  { day: 15, month: 8, year: 2024, hours: 10, minutes: 30 }
   * );
   * console.log(booking);
   *
   * @example - Creating a booking by a user for themselves
   * const booking = await bookingsService.createBooking(
   *  "user123",
   * "user123",
   * "vehicle123",
   * ["service1", "service2"],
   * { day: 15, month: 8, year: 2024, hours: 10, minutes: 30 }
   * );
   * console.log(booking);
   */
  async createBooking(creatorId, userIdToBookFor, vehicleId, serviceIds, timeSlot) {
    const services = await Service.find({ _id: { $in: serviceIds } }).exec();
    if (services.length !== serviceIds.length) {
      console.log("Some services not found:", {
        requested: serviceIds,
        found: services.map((s) => s._id.toString()),
      });

      throw new DomainError(
        "Một hoặc nhiều dịch vụ không được tìm thấy",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    // Stop the same user from booking multiple times for the same vehicle
    const order = await ServiceOrder.findOne({ order_for_id: userIdToBookFor, vehicle_id: vehicleId }).exec();
    if (order) {
      throw new DomainError(
        "Người dùng đã có đơn dịch vụ cho phương tiện này",
        ERROR_CODES.BOOKINGS_VEHICLE_ALREADY_BOOKED,
        409
      );
    }

    const bookingDate = convertTimeSlotToDate(timeSlot);
    const [isValid, errorMessage] = await isBookingDateValid(bookingDate);
    if (!isValid) {
      throw new DomainError(
        errorMessage,
        ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
        400
      );
    }

    const bayId = await findAvailableBay(bookingDate);

    const serviceOrder = new ServiceOrder({
      order_creator_id: creatorId,
      vehicle_id: vehicleId,
      bay_id: bayId,
      timeline: [],
      photos: [],
      service_ids: serviceIds,
      status: "pending",
      started_at: null,
      completed_at: null,
      cancelled_at: null
    });

    await serviceOrder.save();

    return {
      id: serviceOrder._id,
    }
  }

  /**
   * Remove services from a booking.
   * @param {string} bookingId - ID of the booking.
   * @param {Array<string>} serviceIds - Array of service IDs to be removed.
   * @returns {Object} - The updated booking object.
   * @throws {DomainError} - If there is a domain-specific error during service removal.
   */
  async removeServices(bookingId, serviceIds) {
    const booking = await ServiceOrder.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Đơn dịch vụ không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    booking.service_ids = booking.service_ids.filter(
      (id) => !serviceIds.includes(id.toString())
    );

    await booking.save();

    // Don't know what to return here, so just returning the booking ID for now
    // TODO: Update to return more useful info
    return {
      id: booking._id,
    };
  }

  async addServices(bookingId, serviceIds) {
    const booking = await ServiceOrder.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Đơn dịch vụ không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    // Avoid duplicates
    const existingServiceIds = booking.service_ids.map((id) => id.toString());
    const newServiceIds = serviceIds.filter(
      (id) => !existingServiceIds.includes(id)
    );

    booking.service_ids.push(...newServiceIds);
    await booking.save();

    return {
      id: booking._id,
    };
  }

  async getBookingById(bookingId) {
    const booking = (
      await ServiceOrder
        .findById(bookingId)
        .populate("vehicle_id")
        .populate("bay_id")
        .exec()
    );

    const services = await ServicesService.getServiceForBookingById(bookingId);

    // TODO: Integrate clerk for complete info
    return {
      id: booking._id,
      customer: {
        customerName: "Clerk Username here",
      },
      vehicle: {
        licensePlate: booking.vehicle_id.license_plate,
      },
      bay: {
        bayName: booking.bay_id ? booking.bay_id.bay_number : null,
      },
      technicians: [
        {
          technicianName: "Technician Username here",
        },
        {
          technicianName: "Technician Username 2 here",
        }
      ],
      expectedStartTime: booking.expected_start_time,
      startedAt: booking.started_at,
      completedAt: booking.completed_at,
      cancelledAt: booking.cancelled_at,
      status: booking.status,
      services
    }
  }
}

module.exports = new BookingsService();
