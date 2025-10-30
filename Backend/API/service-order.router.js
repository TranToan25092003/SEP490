const express = require("express");
const { param } = require("express-validator");
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
 *     responses:
 *       200:
 *         description: A list of service orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceOrderSummaryDTO'
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
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ServiceOrderDetailDTO'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ServiceOrderItemPayload'
 *     responses:
 *       200:
 *         description: Service order items updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderController.updateServiceOrderItems
);

module.exports = router;
