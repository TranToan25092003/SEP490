const express = require("express");
const { body, param, query } = require("express-validator");
const invoiceController = require("../../controller/invoice.controller");
const { authenticate } = require("../../middleware/guards/authen.middleware");
const {
  throwErrors,
} = require("../../middleware/validate-data/throwErrors.middleware");

const router = new express.Router();

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
    query("status")
      .optional()
      .isIn(["paid", "unpaid"])
      .withMessage("Status must be either 'paid' or 'unpaid'"),
  ],
  throwErrors,
  invoiceController.list
);

router.get(
  "/:id",
  authenticate,
  [
    param("id")
      .notEmpty()
      .withMessage("Invoice ID is required")
      .isMongoId()
      .withMessage("Invoice ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  invoiceController.getById
);

router.patch(
  "/:id/confirm-payment",
  authenticate,
  [
    param("id")
      .notEmpty()
      .withMessage("Invoice ID is required")
      .isMongoId()
      .withMessage("Invoice ID must be a valid MongoDB ObjectId"),
    body("paymentMethod")
      .optional()
      .isIn(["cash", "bank_transfer"])
      .withMessage("Payment method must be 'cash' or 'bank_transfer'"),
  ],
  throwErrors,
  invoiceController.confirmPayment
);

module.exports = router;
