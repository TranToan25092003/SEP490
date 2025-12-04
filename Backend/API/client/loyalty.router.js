const express = require("express");
const router = express.Router();
const loyaltyController = require("../../controller/loyalty.controller");

/**
 * @swagger
 * /loyalty/balance:
 *   get:
 *     summary: (Client) Lấy số dư ví điểm của người dùng hiện tại
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về tổng điểm và thời gian cập nhật
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.get("/balance", loyaltyController.getBalance);

/**
 * @swagger
 * /loyalty/history:
 *   get:
 *     summary: (Client) Lấy lịch sử cộng/trừ điểm
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách giao dịch kèm phân trang
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */

router.get("/history", loyaltyController.getHistory);

/**
 * @swagger
 * /loyalty/redeem/voucher:
 *   post:
 *     summary: (Client) Đổi điểm để lấy voucher được cấu hình sẵn
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rewardId
 *             properties:
 *               rewardId:
 *                 type: string
 *                 description: Mã voucher nằm trong catalog
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Trừ điểm, sinh voucher thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc không đủ điểm
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.post("/redeem/voucher", loyaltyController.redeemVoucher);

/**
 * @swagger
 * /loyalty/redeem:
 *   post:
 *     summary: (Client) Đổi/quy đổi điểm để lấy ưu đãi
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clerkId
 *               - points
 *               - reason
 *             properties:
 *               clerkId:
 *                 type: string
 *               points:
 *                 type: integer
 *               reason:
 *                 type: string
 *               sourceRef:
 *                 type: object
 *                 properties:
 *                   kind:
 *                     type: string
 *                   refId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Quy đổi thành công, trả về giao dịch mới
 *       400:
 *         description: Thiếu dữ liệu hoặc điểm không đủ
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.post("/redeem", loyaltyController.redeemPoints);

/**
 * @swagger
 * /loyalty/award:
 *   post:
 *     summary: (Client/Internal) Cộng điểm cho người dùng
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clerkId
 *               - points
 *               - reason
 *             properties:
 *               clerkId:
 *                 type: string
 *               points:
 *                 type: integer
 *               reason:
 *                 type: string
 *               metadata:
 *                 type: object
 *               sourceRef:
 *                 type: object
 *                 properties:
 *                   kind:
 *                     type: string
 *                   refId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Cộng điểm thành công
 *       400:
 *         description: Thiếu dữ liệu
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.post("/award", loyaltyController.awardPoints);

/**
 * @swagger
 * /loyalty/adjust:
 *   post:
 *     summary: (Client/Internal) Điều chỉnh điểm thủ công
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clerkId
 *               - points
 *               - reason
 *             properties:
 *               clerkId:
 *                 type: string
 *               points:
 *                 type: integer
 *               reason:
 *                 type: string
 *               metadata:
 *                 type: object
 *               sourceRef:
 *                 type: object
 *                 properties:
 *                   kind:
 *                     type: string
 *                   refId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Điều chỉnh thành công
 *       400:
 *         description: Thiếu dữ liệu
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.post("/adjust", loyaltyController.adjustPoints);

module.exports = router;
