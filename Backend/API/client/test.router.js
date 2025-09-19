const express = require("express");
const router = new express.Router();
const controller = require("../../controller/test.controller");
// const { clerkClient } = require("../../config/clerk");

/**
 * @swagger
 * /test:
 *   get:
 *     summary: API test trực tiếp từ app
 *     tags:
 *        - Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", controller.checkHealth);

module.exports = router;
