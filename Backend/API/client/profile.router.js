const express = require("express");
const router = new express.Router();
const controller = require("../../controller/profile.controller");

/**
 * @swagger
 * /profile/models/create:
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
router.post("/models/create", controller.createVehicle);

/**
 * @swagger
 * /profile/models/get:
 *   get:
 *     summary: Lấy danh sách tất cả các hãng xe
 *     tags:
 *       - Vehicle
 *     responses:
 *       200:
 *         description: Lấy danh sách hãng xe thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Honda"
 *                   country:
 *                     type: string
 *                     example: "Japan"
 *       500:
 *         description: Lỗi máy chủ
 */
router.get("/models/get", controller.getModels);

/**
 * @swagger
 * /profile/vehicles/get:
 *   get:
 *     summary: Lấy danh sách tất cả các  xe
 *     tags:
 *       - Vehicle
 *     responses:
 *       200:
 *         description: Lấy danh sách  xe thành công
 *         content:
 *           application/json:
 *       500:
 *         description: Lỗi máy chủ
 */
router.get("/vehicles/get", controller.getVehicles);

// Ẩn một xe khỏi hồ sơ khách hàng (soft-delete phía UI)
router.patch("/vehicles/hide", controller.hideVehicle);

router.patch("/public-metadata", controller.updatePublicMetadata);

module.exports = router;
