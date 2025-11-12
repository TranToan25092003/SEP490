const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middleware/guards/authen.middleware");
const invoiceController = require("../../controller/invoice.controller");

router.get("/", authenticate, invoiceController.listForCustomer);
router.post("/:id/verify-payment", authenticate, invoiceController.verifyPayment);
router.get("/:id", authenticate, invoiceController.getByIdForCustomer);

module.exports = router;

