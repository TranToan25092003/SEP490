const express = require("express");
const { body, query, param } = require("express-validator");
const bookingsController = require("../../controller/bookings.controller");
const { throwErrors } = require("../../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../../middleware/guards/authen.middleware");
const router = new express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *    BookingRequest:
 *      type: object
 *      properties:
 *       serviceIds:
 *        type: array
 *        items:
 *          type: string
 *       timeSlot:
 *        type: object
 *        properties:
 *         day:
 *          type: integer
 *         month:
 *          type: integer
 *         year:
 *          type: integer
 *         hours:
 *          type: integer
 *         minutes:
 *          type: integer
 */

/**
 * @swagger
 * /client/bookings/create:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
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
    body("userIdToBookFor")
      .optional()
      .isString()
      .withMessage("User ID to book for must be a string"),
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
 * /client/bookings/available-time-slots:
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
 * /client/bookings/{bookingId}:
 *   get:
 *     summary: Get booking details by ID
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       400:
 *         description: Bad request - Invalid booking ID
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:bookingId",
  [
    param("bookingId")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  bookingsController.getBookingById
);

/**
 * @swagger
 * /client/bookings/{bookingId}/add-services:
 *   post:
 *     summary: Add services to an existing booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Services added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 */
router.post(
  "/:bookingId/add-services",
  [
    param("bookingId")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
    body("serviceIds")
      .isArray({ min: 1 })
      .withMessage("Service IDs must be a non-empty array"),
    body("serviceIds.*")
      .isMongoId()
      .withMessage("Each service ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  bookingsController.addServices
);

/**
 * @swagger
 * /client/bookings/{bookingId}/remove-services:
 *   post:
 *     summary: Remove services from an existing booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Services removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 */
router.post(
  "/:bookingId/remove-services",
  [
    param("bookingId")
      .notEmpty()
      .withMessage("Booking ID is required")
      .isMongoId()
      .withMessage("Booking ID must be a valid MongoDB ObjectId"),
    body("serviceIds")
      .isArray({ min: 1 })
      .withMessage("Service IDs must be a non-empty array"),
    body("serviceIds.*")
      .isMongoId()
      .withMessage("Each service ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  bookingsController.removeServices
);

module.exports = router;
