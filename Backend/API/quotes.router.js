const express = require("express");
const { body, query, param } = require("express-validator");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const quotesController = require("../controller/quotes.controller");
const router = new express.Router();

/**
 * @swagger
 * /quotes:
 *   get:
 *     summary: List all quotes with pagination
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: serviceOrderId
 *         schema:
 *           type: string
 *         description: Filter by service order ID
 *     responses:
 *       200:
 *         description: List of quotes with pagination
 *       400:
 *         description: Bad request - Invalid parameters
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("serviceOrderId")
      .optional()
      .isMongoId()
      .withMessage("Service Order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  quotesController.listQuotes
);

/**
 * @swagger
 * /quotes/{id}:
 *   get:
 *     summary: Get a quote by ID
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quote ID
 *     responses:
 *       200:
 *         description: Quote details
 *       404:
 *         description: Quote not found
 */
router.get(
  "/:id",
  [
    param("id")
      .notEmpty()
      .withMessage("Quote ID is required")
      .isMongoId()
      .withMessage("Quote ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  quotesController.getQuoteById
);

/**
 * @swagger
 * /quotes/service-order/{serviceOrderId}:
 *   post:
 *     summary: Create a quote from a service order
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: path
 *         name: serviceOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service Order ID
 *     responses:
 *       201:
 *         description: Quote created successfully
 *       400:
 *         description: Bad request - Service order has no items
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Conflict - Quote already exists for this service order
 */
router.post(
  "/service-order/:serviceOrderId",
  [
    param("serviceOrderId")
      .notEmpty()
      .withMessage("Service Order ID is required")
      .isMongoId()
      .withMessage("Service Order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  quotesController.createQuote
);

/**
 * @swagger
 * /quotes/{id}/approve:
 *   post:
 *     summary: Approve a quote
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quote ID
 *     responses:
 *       200:
 *         description: Quote approved successfully
 *       400:
 *         description: Bad request - Invalid state transition
 *       404:
 *         description: Quote not found
 */
router.post(
  "/:id/approve",
  [
    param("id")
      .notEmpty()
      .withMessage("Quote ID is required")
      .isMongoId()
      .withMessage("Quote ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  quotesController.approveQuote
);

/**
 * @swagger
 * /quotes/{id}/reject:
 *   post:
 *     summary: Reject a quote with a reason
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quote ID
 *     responses:
 *       200:
 *         description: Quote rejected successfully
 *       400:
 *         description: Bad request - Invalid state transition or missing reason
 *       404:
 *         description: Quote not found
 */
router.post(
  "/:id/reject",
  [
    param("id")
      .notEmpty()
      .withMessage("Quote ID is required")
      .isMongoId()
      .withMessage("Quote ID must be a valid MongoDB ObjectId"),
    body("reason")
      .notEmpty()
      .withMessage("Rejection reason is required")
      .isString()
      .withMessage("Reason must be a string")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Reason cannot be empty"),
  ],
  throwErrors,
  authenticate,
  quotesController.rejectQuote
);

module.exports = router;
