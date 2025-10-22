const express = require("express");
const servicesController = require("../../controller/services.controller");
const router = new express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         basePrice:
 *          type: number
 *         description:
 *           type: string
 *         estimatedTimeInMinutes:
 *           type: integer
 */

/**
 * @swagger
 * /client/services:
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
 *                 $ref: '#/components/schemas/Service'
 */
router.get("/", servicesController.getAllServices);

module.exports = router;
