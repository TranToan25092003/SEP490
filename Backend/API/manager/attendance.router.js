const express = require("express");
const router = express.Router();
const attendanceController = require("../../controller/attendance.controller");

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Quản lý điểm danh nhân viên theo ca
 */

/**
 * @swagger
 * /manager/attendance:
 *   get:
 *     summary: Lấy bảng điểm danh theo ngày
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần lấy dữ liệu (YYYY-MM-DD). Nếu bỏ trống hệ thống sẽ lấy ngày hiện tại.
 *     responses:
 *       200:
 *         description: Bảng điểm danh theo ngày
 */
router.get("/", attendanceController.getAttendanceByDate);

/**
 * @swagger
 * /manager/attendance:
 *   put:
 *     summary: Lưu / cập nhật bảng điểm danh của ngày
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - entries
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, saved]
 *               savedBy:
 *                 type: string
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [staffId]
 *                   properties:
 *                     staffId:
 *                       type: string
 *                     staffName:
 *                       type: string
 *                     position:
 *                       type: string
 *                     morningShift:
 *                       type: boolean
 *                     afternoonShift:
 *                       type: boolean
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Lưu thành công
 */
router.put("/", attendanceController.saveAttendance);

/**
 * @swagger
 * /manager/attendance/shift:
 *   patch:
 *     summary: Điểm danh nhanh toàn bộ nhân viên theo ca
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - shift
 *               - value
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               shift:
 *                 type: string
 *                 enum: [morningShift, afternoonShift]
 *               value:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch("/shift", attendanceController.markShiftForAll);

/**
 * @swagger
 * /manager/attendance/reset:
 *   patch:
 *     summary: Xóa trạng thái điểm danh của một ngày
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Đã xóa trạng thái điểm danh
 */
router.patch("/reset", attendanceController.resetAttendance);

/**
 * @swagger
 * /manager/attendance/history:
 *   get:
 *     summary: Lấy lịch sử điểm danh trong khoảng ngày
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách bảng điểm danh theo khoảng ngày
 */
router.get("/history", attendanceController.getHistory);

module.exports = router;
