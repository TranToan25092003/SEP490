const express = require("express");
const router = new express.Router();
const controller = require("../../controller/profile.controller");

/**
 * @swagger
 * /create/vehicle:
 *   post:
 *     summary: Tạo mới thông tin phương tiện
 *     tags:
 *       - Vehicle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "aaa"
 *               brand:
 *                 type: string
 *                 example: "12311"
 *               license_plate:
 *                 type: string
 *                 example: "26AA-1223"
 *               year:
 *                 type: integer
 *                 example: 2024
 *               engine_type:
 *                 type: string
 *                 example: "1111"
 *               description:
 *                 type: string
 *                 example: "111"
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       201:
 *         description: Tạo phương tiện thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa được xác thực (thiếu hoặc sai bearer token)
 *       500:
 *         description: Lỗi máy chủ
 */

router.get("/models/get", controller.getModels);

module.exports = router;
