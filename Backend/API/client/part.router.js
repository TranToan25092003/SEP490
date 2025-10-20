const express = require("express");
const partController = require("../../controller/client/part.controller");
const router = new express.Router();


/**
 * @swagger
 * /parts:
 * get:
 * summary: (Client) Get all active parts with pagination and filtering
 * tags:
 * - Parts
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: Page number
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * description: Items per page
 * - in: query
 * name: search
 * schema:
 * type: string
 * description: Search term for name or description
 * - in: query
 * name: brand
 * schema:
 * type: string
 * description: Brand filter
 * - in: query
 * name: vehicleModel
 * schema:
 * type: string
 * description: Vehicle model ID filter
 * responses:
 * 200:
 * description: Active parts retrieved successfully
 * 500:
 * description: Server error
 */
router.get("/", partController.getAllPartsByClient);

module.exports = router;