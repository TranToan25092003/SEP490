const express = require("express");
const router = new express.Router();
const partController = require("../../controller/part.controller");

/**
 * @swagger
 * /manager/parts:
 *   get:
 *     summary: Get all parts with pagination and filtering
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Brand filter
 *       - in: query
 *         name: vehicleModel
 *         schema:
 *           type: string
 *         description: Vehicle model ID filter
 *     responses:
 *       200:
 *         description: Parts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", partController.getAllParts);

/**
 * @swagger
 * /manager/parts/vehicle-models:
 *   get:
 *     summary: Get all vehicle models
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle models retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/vehicle-models", partController.getAllVehicleModels);

/**
 * @swagger
 * /manager/parts/vehicle-model/{modelId}:
 *   get:
 *     summary: Get parts by vehicle model
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle model ID
 *     responses:
 *       200:
 *         description: Parts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/vehicle-model/:modelId", partController.getPartsByVehicleModel);

/**
 * @swagger
 * /manager/parts/brand/{brand}:
 *   get:
 *     summary: Get parts by brand
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brand
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand name
 *     responses:
 *       200:
 *         description: Parts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/brand/:brand", partController.getPartsByBrand);

/**
 * @swagger
 * /manager/parts/{id}:
 *   get:
 *     summary: Get single part by ID
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Part ID
 *     responses:
 *       200:
 *         description: Part retrieved successfully
 *       404:
 *         description: Part not found
 *       500:
 *         description: Server error
 */
router.get("/:id", partController.getPartById);

/**
 * @swagger
 * /manager/parts:
 *   post:
 *     summary: Create new part
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sellingPrice
 *               - costPrice
 *             properties:
 *               name:
 *                 type: string
 *                 description: Part name
 *               sellingPrice:
 *                 type: number
 *                 description: Selling price
 *               costPrice:
 *                 type: number
 *                 description: Cost price
 *               description:
 *                 type: string
 *                 description: Part description
 *               brand:
 *                 type: string
 *                 description: Part brand
 *               compatible_model_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Compatible vehicle model IDs
 *               quantity:
 *                 type: number
 *                 description: Stock quantity
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                     url:
 *                       type: string
 *                     kind:
 *                       type: string
 *                       enum: [image, video, pdf, other]
 *                 description: Media assets
 *     responses:
 *       201:
 *         description: Part created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/", partController.createPart);

/**
 * @swagger
 * /manager/parts/{id}:
 *   put:
 *     summary: Update part
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Part ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               description:
 *                 type: string
 *               brand:
 *                 type: string
 *               compatible_model_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               quantity:
 *                 type: number
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Part updated successfully
 *       404:
 *         description: Part not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.put("/:id", partController.updatePart);

/**
 * @swagger
 * /manager/parts/{id}:
 *   delete:
 *     summary: Delete part
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Part ID
 *     responses:
 *       200:
 *         description: Part deleted successfully
 *       404:
 *         description: Part not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", partController.deletePart);

/**
 * @swagger
 * /manager/parts/bulk-delete:
 *   post:
 *     summary: Bulk delete parts
 *     tags:
 *        - Parts Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of part IDs to delete
 *     responses:
 *       200:
 *         description: Bulk delete completed
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/bulk-delete", partController.bulkDeleteParts);

module.exports = router;
