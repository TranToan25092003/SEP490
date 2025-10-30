const express = require("express");
const complaintController = require("../../controller/client/complaint.controller");
const { authenticate } = require("../../middleware/guards/authen.middleware");

const router = new express.Router();

router.post("/", authenticate, complaintController.createComplaint);

module.exports = router;