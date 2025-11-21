const express = require("express");
const { body, param } = require("express-validator");
const warrantyController = require("../controller/warranty.controller");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = new express.Router();

/**
 * @swagger
 * /warranty/create-booking:
 *   post:
 *     summary: Create a warranty booking
 *     tags:
 *       - Warranty
 */
router.post(
  "/create-booking",
  [
    body("vehicleId")
      .notEmpty()
      .withMessage("Vehicle ID is required")
      .isMongoId()
      .withMessage("Vehicle ID must be a valid MongoDB ObjectId"),
    body("serviceOrderId")
      .notEmpty()
      .withMessage("Service Order ID is required")
      .isMongoId()
      .withMessage("Service Order ID must be a valid MongoDB ObjectId"),
    body("selectedParts")
      .isArray({ min: 1 })
      .withMessage("Selected parts must be a non-empty array"),
    body("selectedParts.*.partId")
      .notEmpty()
      .withMessage("Part ID is required")
      .isMongoId()
      .withMessage("Part ID must be a valid MongoDB ObjectId"),
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
  warrantyController.createWarrantyBooking
);

/**
 * @swagger
 * /warranty/me:
 *   get:
 *     summary: Get warranties for the authenticated user
 *     tags:
 *       - Warranty
 */
router.get(
  "/me",
  authenticate,
  warrantyController.getUserWarranties
);

/**
 * @swagger
 * /warranty/check-eligibility/{serviceOrderId}:
 *   get:
 *     summary: Check warranty eligibility for a service order
 *     tags:
 *       - Warranty
 */
router.get(
  "/check-eligibility/:serviceOrderId",
  [
    param("serviceOrderId")
      .notEmpty()
      .withMessage("Service Order ID is required")
      .isMongoId()
      .withMessage("Service Order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  warrantyController.checkWarrantyEligibility
);

/**
 * @swagger
 * /warranty/{id}:
 *   get:
 *     summary: Get a warranty by ID
 *     tags:
 *       - Warranty
 */
router.get(
  "/:id",
  [
    param("id")
      .notEmpty()
      .withMessage("Warranty ID is required")
      .isMongoId()
      .withMessage("Warranty ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  warrantyController.getWarrantyById
);

module.exports = router;

