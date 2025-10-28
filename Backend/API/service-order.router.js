const express = require("express");
const { param } = require("express-validator");
const serviceOrderController = require("../controller/staff/service-order.controller");
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
 *     responses:
 *       200:
 *         description: A list of service orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceOrderSummaryDTO'
 */
router.get(
  "/",
  authenticate,
  serviceOrderController.getAllServiceOrders
);

/**
 * @swagger
 * /service-orders/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceOrderDetailDTO'
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

module.exports = router;
