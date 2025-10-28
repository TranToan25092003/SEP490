const express = require("express");
const { body, param } = require("express-validator");
const vehiclesController = require("../controller/vehicles.controller");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const authenticate = require("../middleware/guards/authen.middleware").authenticate;
const router = new express.Router();

/**
 * @swagger
 * /vehicles/with-availability:
 *   get:
 *     summary: Retrieve a list of vehicles with availability for the authenticated user
 *     tags:
 *       - Vehicle
 *     responses:
 *       200:
 *         description: A list of vehicles with availability
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VehicleWithAvailabilityDTO'
 */
router.get("/with-availability", authenticate, vehiclesController.getVehiclesWithAvailability);

module.exports = router;
