const express = require("express");
const { body, param } = require("express-validator");
const vehiclesController = require("../../controller/vehicles.controller");
const { throwErrors } = require("../../middleware/validate-data/throwErrors.middleware");
const router = new express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     VehicleSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         licensePlate:
 *           type: string
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: number
 */

/**
 * @swagger
 * /client/vehicles/summary:
 *   get:
 *     summary: Retrieve a list of summary vehicles for the authenticated user
 *     tags:
 *       - Vehicles
 *     responses:
 *       200:
 *         description: A list of summary vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VehicleSummary'
 */
router.get("/", vehiclesController.getUserVehicles);

module.exports = router;
