const express = require("express");
const router = express.Router();
const invoiceController = require("../../controller/invoice.controller");

router.get("/", invoiceController.listForCustomer);
router.get("/:id", invoiceController.getByIdForCustomer);

module.exports = router;

