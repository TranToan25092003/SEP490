const express = require("express");
const managerController = require("../controller/manager.controller");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = express.Router();

/**
 * @swagger
 * /manager/dashboard:
 *   get:
 *     summary: Get manager dashboard data
 *     tags:
 *       - Manager
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get("/dashboard", authenticate, managerController.getDashboard);

module.exports = router;

