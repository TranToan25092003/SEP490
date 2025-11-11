const express = require("express");
const { param, query } = require("express-validator");
const serviceOrderController = require("../controller/service-order.controller");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = express.Router();

/**
 * @swagger
 * /service-orders:
 *   get:
 *     summary: Get all service orders
 *     tags:
 *       - Service Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: customerName
 *         schema:
 *           type: string
 *         description: Filter by customer name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: startTimestamp
 *         schema:
 *           type: integer
 *         description: Filter by start timestamp
 *       - in: query
 *         name: endTimestamp
 *         schema:
 *           type: integer
 *         description: Filter by end timestamp
 *     responses:
 *       200:
 *         description: A list of service orders
 */
router.get(
  "/",
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
      .isIn([
        "created",
        "waiting_inspection",
        "inspection_completed",
        "waiting_customer_approval",
        "approved",
        "scheduled",
        "servicing",
        "completed",
        "cancelled"
      ])
      .withMessage(
        "Status must be one of: created, waiting_inspection, inspection_completed, waiting_customer_approval, approved, scheduled, servicing, completed, cancelled"
      ),
    query("startTimestamp")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Start timestamp must be a valid integer"),
    query("endTimestamp")
      .optional()
      .isInt({ min: 0 })
      .withMessage("End timestamp must be a valid integer"),
  ],
  throwErrors,
  serviceOrderController.getAllServiceOrders
);

/**
 * @swagger
 * /service-orders/{}:
 *   get:
 *     summary: Get service order by ID
 *     tags:
 *       - Service Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service order
 *     responses:
 *       200:
 *         description: Service order retrieved successfully
 *       404:
 *         description: Service order not found
 */
router.get(
  "/:id",
  [
    param("id")
      .notEmpty()
      .withMessage("Service order ID is required")
      .isMongoId()
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderController.getServiceOrderById
);

/**
 * @swagger
 * /service-orders/{id}/items:
 *   put:
 *     summary: Update items in a service order
 *     tags:
 *       - Service Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service order
 *     responses:
 *       200:
 *         description: Service order items updated successfully
 *       404:
 *         description: Service order not found
 */
router.put(
  "/:id/items",
  [
    param("id")
      .notEmpty()
      .withMessage("Service order ID is required")
      .isMongoId()
      .withMessage("Service order ID must be a valid MongoDB ObjectId")
  ],
  throwErrors,
  authenticate,
  serviceOrderController.updateServiceOrderItems
);

module.exports = router;
