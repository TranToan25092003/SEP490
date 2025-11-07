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
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderController.updateServiceOrderItems
);

module.exports = router;
