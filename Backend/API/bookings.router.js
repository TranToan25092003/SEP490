const express = require("express");
const { body, query, param } = require("express-validator");
const bookingsController = require("../controller/bookings.controller");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = new express.Router();

/**
 * @swagger
 * /bookings/create:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Conflict - Time slot is unavailable
 */
router.post(
  "/create",
  [
    body("vehicleId")
      .notEmpty()
      .withMessage("Vehicle ID is required")
      .isMongoId()
      .withMessage("Vehicle ID must be a valid MongoDB ObjectId"),
    body("serviceIds")
      .isArray({ min: 1 })
      .withMessage("Service IDs must be a non-empty array"),
    body("serviceIds.*")
      .isMongoId()
      .withMessage("Each service ID must be a valid MongoDB ObjectId"),
    body("timeSlot")
      .notEmpty()
      .withMessage("Time slot is required")
      .isObject()
      .withMessage("Time slot must be an object"),
    body("timeSlot.day")
      .notEmpty()
      .withMessage("Day is required")
      .isInt({ min: 1, max: 31 })
      .withMessage("Day must be between 1 and 31"),
    body("timeSlot.month")
      .notEmpty()
      .withMessage("Month is required")
      .isInt({ min: 1, max: 12 })
      .withMessage("Month must be between 1 and 12"),
    body("timeSlot.year")
      .notEmpty()
      .withMessage("Year is required")
      .isInt({ min: 1970 })
      .withMessage("Year must be 1970 or later"),
    body("timeSlot.hours")
      .notEmpty()
      .withMessage("Hours is required")
      .isInt({ min: 0, max: 23 })
      .withMessage("Hours must be between 0 and 23"),
    body("timeSlot.minutes")
      .notEmpty()
      .withMessage("Minutes is required")
      .isInt({ min: 0, max: 59 })
      .withMessage("Minutes must be between 0 and 59"),
  ],
  throwErrors,
  authenticate,
  bookingsController.createBooking
);

/**
 * @swagger
 * /bookings/all:
 *   get:
 *     summary: Get all bookings for the staff
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A list of bookings
 */
router.get(
  "/all",
  authenticate,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("customerName")
      .optional()
      .isString()
      .withMessage("Customer name must be a string"),
    query("status")
      .optional()
      .isIn(["booked", "in_progress", "cancelled", "completed", "checked_in"])
      .withMessage("Status must be one of: booked, in_progress, cancelled, completed, checked_in"),
    query("startTimestamp")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Start timestamp must be a valid integer"),
    query("endTimestamp")
      .optional()
      .isInt({ min: 0 })
      .withMessage("End timestamp must be a valid integer")
  ],
  throwErrors,
  bookingsController.getAllBookings
);

/**
 * @swagger
 * /bookings/me:
 *   get:
 *     summary: Get bookings for the authenticated user
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A list of user's bookings
 */
router.get(
  "/me",
  authenticate,
  bookingsController.getUserBookings
);

/**
 * @swagger
 * /bookings/available-time-slots:
 *   get:
 *     summary: Get available time slots for a specific date
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: query
 *         name: day
 *         required: true
 *         schema:
 *           type: integer
 *         description: Day of the month
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *       400:
 *         description: Bad request - Missing or invalid parameters
 */
router.get(
  "/available-time-slots",
  [
    query("day")
      .notEmpty()
      .withMessage("Day is required")
      .isInt({ min: 1, max: 31 })
      .withMessage("Day must be between 1 and 31"),
    query("month")
      .notEmpty()
      .withMessage("Month is required")
      .isInt({ min: 1, max: 12 })
      .withMessage("Month must be between 1 and 12"),
    query("year")
      .notEmpty()
      .withMessage("Year is required")
      .isInt({ min: 2024 })
      .withMessage("Year must be 2024 or later"),
  ],
  throwErrors,
  bookingsController.getAvailableTimeSlots
);



/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the booking
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:id",
  [
    param("id")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  bookingsController.getBookingById
)

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the booking to cancel
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       409:
 *         description: Conflict - Invalid booking state
 *       404:
 *         description: Booking not found
 */
router.post(
  "/:id/cancel",
  [
    param("id")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  bookingsController.cancelBooking
);

/**
 * @swagger
 * /bookings/{id}/check-in:
 *   post:
 *     summary: Check in a booking by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the booking to check in
 *     responses:
 *       200:
 *         description: Booking checked in successfully
 *       409:
 *         description: Conflict - Invalid booking state
 *       404:
 *         description: Booking not found
 */
router.post("/:id/check-in",
  [
    param("id")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  bookingsController.checkInBooking
);


module.exports = router;
