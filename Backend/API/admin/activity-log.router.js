const express = require("express");
const controller = require("../../controller/activityLog.controller");
const { authenticate } = require("../../middleware/guards/authen.middleware");
const { roleProtected } = require("../../middleware/guards/role.middleware");

const router = new express.Router();

router.use(authenticate);
router.use(roleProtected);

router.get("/", controller.listActivityLogs);

module.exports = router;

