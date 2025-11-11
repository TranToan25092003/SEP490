const express = require("express");
const baysController = require("../controller/bays.controller");
const {
  throwErrors,
} = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const { query } = require("express-validator");
const router = new express.Router();

/**
 * @swagger
 * /bays/:
 *   get:
 *     summary: Retrieve all bays
 *     tags:
 *       - Bays
 *     responses:
 *       200:
 *         description: A list of bays
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BayDTO'
 */
router.get("/", authenticate, throwErrors, baysController.getAllBays);

/**
 * @swagger
 * /bays/{id}/slots:
 *   get:
 *     summary: Retrieve the next N available slots for a specific bay
 *     tags:
 *       - Bays
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the bay
 *       - in: query
 *         name: n
 *         required: true
 *         schema:
 *           type: integer
 *         description: The number of available slots to retrieve
 *       - in: query
 *         name: duration
 *         required: true
 *         schema:
 *           type: integer
 *         description: The expected duration of the task in minutes
 *     responses:
 *       200:
 *         description: A list of available slots for the specified bay
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date-time
 *                   end:
 *                     type: string
 *                     format: date-time
 */
router.get(
  "/:id/slots",
  authenticate,
  [
    query("n").isInt({ min: 1 }).withMessage("n must be a positive integer."),
    query("duration")
      .isInt({ min: 1 })
      .withMessage("duration must be a positive integer."),
  ],
  throwErrors,
  baysController.getNSlots
);

module.exports = router;
