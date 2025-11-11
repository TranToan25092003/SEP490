const express = require("express");
const controller = require("../../controller/activityLog.controller");
const router = new express.Router();

router.post("/", controller.createActivityLog);
router.post("/login", controller.createLoginLog);
router.get("/", controller.listActivityLogs);

module.exports = router;
