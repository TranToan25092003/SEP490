const bookingsService = require("../service/bookings.service");

class BookingsController {
  async createBooking(req, res, next) {
    try {
      const { vehicleId, serviceIds, timeSlot } = req.body;
      const customerId = req.userId;

      const booking = await bookingsService.createBooking(
        customerId,
        vehicleId,
        serviceIds,
        timeSlot
      );

      res.status(201).json({
        data: booking,
        message: "Booking created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;

      const booking = await bookingsService.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.status(200).json({
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req, res, next) {
    try {
      const bookings = await bookingsService.getAllBookingsSortedAscending();

      res.status(200).json({
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableTimeSlots(req, res, next) {
    try {
      const { day, month, year } = req.query;

      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      const timeSlots = await bookingsService.getTimeSlotsForDMY(
        dayNum,
        monthNum,
        yearNum
      );

      res.status(200).json({
        data: {
          timeSlots,
          comment: "Vui lòng đến trước giờ hẹn 10 phút.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingsController();
