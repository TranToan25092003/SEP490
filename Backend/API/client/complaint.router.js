const express = require("express");
const complaintController = require("../../controller/client/complaint.controller");

const router = new express.Router();

router.post("/", complaintController.createComplaint);

module.exports = router;