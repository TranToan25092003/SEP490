const express = require("express");
const servicesController = require("../controller/services.controller");
const router = new express.Router();

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Retrieve a list of all available services
 *     tags:
 *       - Services
 *     responses:
 *       200:
 *         description: A list of services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceDTO'
 */
router.get("/", servicesController.getAllServices);

module.exports = router;
