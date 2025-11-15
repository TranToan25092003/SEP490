const express = require("express");
const dashboardController = require("../../controller/staff/dashboard.controller");

const router = new express.Router();

router.get("/", dashboardController.getStaffDashboardData);

module.exports = router;