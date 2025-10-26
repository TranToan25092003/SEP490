const DomainError = require("../errors/domainError");
const { Service, ServiceOrder, ServiceOrderItem } = require("../model");
const BaySchedulingService = require("./bay_scheduling.service");
const ServicesService = require("./services.service");
const vehiclesService = require("./vehicles.service");

const ERROR_CODES = {
  BOOKINGS_SERVICE_NOT_FOUND: "BOOKINGS_SERVICE_NOT_FOUND",
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
    const items = await this.convertServiceIdsToServiceItems(serviceIds);

    const vehicleIdsInUse = await vehiclesService.getVehiclesInUse([vehicleId]);
    if (vehicleIdsInUse.includes(vehicleId)) {
      throw new DomainError(
        "Người dùng đã có đơn dịch vụ cho phương tiện này",
        ERROR_CODES.BOOKINGS_VEHICLE_ALREADY_BOOKED,
        409
      );
    }

    const checkInTimeslot = convertTimeSlotToDate(timeSlot);

    let checkInTask;
    try {
      checkInTask = await BaySchedulingService.scheduleCheckIn(checkInTimeslot);
    } catch (e) {
      if (e instanceof DomainError) {
        throw new DomainError(
          "Khung thời gian không khả dụng",
          ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
          409
        );
      }

      throw e;
    }

    try {
      const serviceOrder = new ServiceOrder({
        order_creator_id: creatorId,
        order_for_id: userIdToBookFor,
        vehicle_id: vehicleId,
        items: items,
        status: "booked",
        expected_start_time: checkInTimeslot,
        started_at: null,
        expected_completion_time: null,
        completed_at: null,
        cancelled_at: null
      });

      await serviceOrder.save();

      return {
        id: serviceOrder._id,
      }
    } catch (_) {
      await checkInTask.deleteOne();
    }
  }

  /**
   *
   * @param {string} bookingId
   * @param {{
   *  technicianClerkId: string,
   *  role: "lead" | "assistant"
   * }[]} techniciansInfo
   * @param {Date | undefined} startDate - If not provided, the system will schedule it as early as possible
   * @returns {Object} - Don't know yet
   * @throws {DomainError} - If there is a domain-specific error during starting service.
   * @example - Starting service for a booking
   * const service = await bookingsService.startService(
   *  "booking123",
   *  [
   *    { technicianClerkId: "tech1", role: "lead" },
   *    { technicianClerkId: "tech2", role: "assistant" }
   *  ]
   * );
   * console.log(service);
   */
  async startService(bookingId, techniciansInfo, startDate) {
    const booking = await ServiceOrder.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Đơn dịch vụ không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    if (["in_progress", "completed", "cancelled"].includes(booking.status)) {
      throw new DomainError(
        "Không thể bắt đầu dịch vụ cho đơn dịch vụ ở trạng thái hiện tại",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        409
      );
    }

    if (!startDate) {
      const suggestions = await BaySchedulingService.suggestNextNTimeslotForServicingTask(
        booking,
        techniciansInfo
      );

      // weird case
      if (!suggestions || suggestions.length === 0) {
        throw new DomainError(
          "Không có khung thời gian khả dụng để bắt đầu dịch vụ",
          ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
          409
        );
      }

      startDate = suggestions[0].start;
    }

    try {
      const servicingTask = await BaySchedulingService.scheduleServicingTask(
        bookingId,
        techniciansInfo,
        new Date(), // Start now
        new Date(Date.now() + 2 * 60 * 60 * 1000) // Expected to end in 2 hours
      );

      booking.status = "in_progress";
      booking.started_at = new Date();
      booking.expected_completion_time = servicingTask.expected_end_time;
      await booking.save();

      return {
        id: booking._id,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw new DomainError(
          "Khung thời gian không khả dụng, vui lòng chọn khung thời gian khác",
          ERROR_CODES.BOOKINGS_INVALID_TIME_SLOT,
          409
        );
      }

      throw err;
    }
  }

  async confirmBooking(bookingId) {
    const booking = await ServiceOrder.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Đơn dịch vụ không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    if (booking.status !== "waiting_customer_approval") {
      throw new DomainError(
        "Không thể phê duyệt đơn dịch vụ ở trạng thái hiện tại",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        409
      );
    }

    booking.status = "confirmed";
    await booking.save();
  }

  async cancelBooking(bookingId) {
    const booking = await ServiceOrder.findById(bookingId).exec();
    if (!booking) {
      throw new DomainError(
        "Đơn dịch vụ không tồn tại",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    if (["completed", "cancelled", "in_progress"].includes(booking.status)) {
      throw new DomainError(
        "Không thể hủy đơn dịch vụ ở trạng thái hiện tại",
        ERROR_CODES.BOOKINGS_STATE_INVALID,
        409
      );
    }

    booking.status = "cancelled";
    await booking.save();
  }

  async convertServiceIdsToServiceItems(serviceIds) {
    const nonDuplicateServiceIds = [...new Set(serviceIds)];

    const services = await Service.find({ _id: { $in: nonDuplicateServiceIds } }).exec();
    if (services.length !== nonDuplicateServiceIds.length) {
      throw new DomainError(
        "Một hoặc nhiều dịch vụ không được tìm thấy",
        ERROR_CODES.BOOKINGS_SERVICE_NOT_FOUND,
        404
      );
    }

    return services.map(service => new ServiceOrderItem({
      price: service.base_price,
      quantity: 1,
      service_id: service._id
    }));
  }

  async getBookingById(bookingId) {
    const booking = (
      await ServiceOrder
        .findById(bookingId)
        .populate("vehicle_id")
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
      expectedCompletionTime: booking.expected_completion_time,
      completedAt: booking.completed_at,
      cancelledAt: booking.cancelled_at,
      status: booking.status,
      services
    }
  }
}

module.exports = new BookingsService();
