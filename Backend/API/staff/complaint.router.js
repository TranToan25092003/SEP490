const express = require("express");
const complaintController = require("../../controller/staff/complaint.controller");

const router = new express.Router();

router.get("/", complaintController.getAllComplaints);

module.exports = router;