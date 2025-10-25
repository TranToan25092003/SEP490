const bookingsService = require("../service/bookings.service");
const DomainError = require("../errors/domainError");

class BookingsController {
  async createBooking(req, res, next) {
    try {
      const { vehicleId, serviceIds, timeSlot } = req.body;
      const creatorId = req.userId;
      const userIdToBookFor = req.body.userIdToBookFor || creatorId;

      const booking = await bookingsService.createBooking(
        creatorId,
        userIdToBookFor,
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
      const { bookingId } = req.params;

      const booking = await bookingsService.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      res.status(200).json({
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async addServices(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { serviceIds } = req.body;

      const result = await bookingsService.addServices(bookingId, serviceIds);

      res.status(200).json({
        data: result,
        message: "Services added successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async removeServices(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { serviceIds } = req.body;

      const result = await bookingsService.removeServices(bookingId, serviceIds);

      res.status(200).json({
        data: result,
        message: "Services removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableTimeSlots(req, res, next) {
    try {
      const { day, month, year } = req.query;

      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Mock: Generate time slots
      // TODO: Replace with actual availability check from database
      const timeSlots = [];
      const startHour = 8;
      const endHour = 17;

      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const isAvailable = Math.random() > 0.3;
          timeSlots.push({
            hours: hour,
            minutes: minute,
            day: dayNum,
            month: monthNum,
            year: yearNum,
            isAvailable,
          });
        }
      }

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
