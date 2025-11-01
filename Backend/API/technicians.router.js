const express = require("express");
const techniciansController = require("../controller/technicians.controller");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = express.Router();

/**
 * @swagger
 * /technicians:
 *   get:
 *     summary: Get all technicians with their current status
 *     tags:
 *       - Technicians
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of technicians with availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TechnicianInfoWithAvailabilityDTO'
 */
router.get(
  "/",
  authenticate,
  techniciansController.getTechniciansWithStatus
);

module.exports = router;
