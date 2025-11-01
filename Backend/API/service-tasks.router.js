const express = require("express");
const { body, param } = require("express-validator");
const serviceOrderTaskController = require("../controller/service-order-task.controller");
const { throwErrors } = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = express.Router();

/**
 * @swagger
 * /service-tasks/inspection/{serviceOrderId}/schedule:
 *   post:
 *     summary: Schedule an inspection for a service order
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicians
 *               - expectedDurationInMinutes
 *             properties:
 *               technicians:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechnicianInfo'
 *               expectedDurationInMinutes:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Inspection scheduled successfully
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Service order in invalid state
 */
router.post(
  "/inspection/:serviceOrderId/schedule",
  [
    param("serviceOrderId")
      .notEmpty()
      .withMessage("Service order ID is required")
      .isMongoId()
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
    body("technicians")
      .isArray({ min: 1 })
      .withMessage("Technicians array is required and must contain at least one technician"),
    body("technicians.*.technicianClerkId")
      .notEmpty()
      .withMessage("Technician Clerk ID is required"),
    body("technicians.*.role")
      .isIn(["lead", "assistant"])
      .withMessage("Role must be either 'lead' or 'assistant'"),
    body("expectedDurationInMinutes")
      .isInt({ min: 1 })
      .withMessage("Expected duration must be a positive integer"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.scheduleInspection
);

/**
 * @swagger
 * /service-tasks/inspection/{taskId}/begin:
 *   post:
 *     summary: Begin an inspection task
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the inspection task
 *     responses:
 *       200:
 *         description: Inspection task started successfully
 *       404:
 *         description: Inspection task not found
 */
router.post(
  "/inspection/:taskId/begin",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.beginInspectionTask
);

/**
 * @swagger
 * /service-tasks/inspection/{taskId}/complete:
 *   post:
 *     summary: Complete an inspection task
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the inspection task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteInspectionPayload'
 *     responses:
 *       200:
 *         description: Inspection completed successfully
 *       404:
 *         description: Inspection task not found
 */
router.post(
  "/inspection/:taskId/complete",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
    body("comment")
      .notEmpty()
      .withMessage("Comment is required"),
    body("photoUrls")
      .isArray()
      .withMessage("Photo URLs must be an array"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.completeInspection
);

/**
 * @swagger
 * /service-tasks/servicing/{serviceOrderId}/schedule:
 *   post:
 *     summary: Schedule a servicing task for a service order
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the service order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicians
 *               - expectedDurationInMinutes
 *             properties:
 *               technicians:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechnicianInfo'
 *               expectedDurationInMinutes:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Service scheduled successfully
 *       404:
 *         description: Service order not found
 *       409:
 *         description: Service order in invalid state
 */
router.post(
  "/servicing/:serviceOrderId/schedule",
  [
    param("serviceOrderId")
      .notEmpty()
      .withMessage("Service order ID is required")
      .isMongoId()
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
    body("technicians")
      .isArray({ min: 1 })
      .withMessage("Technicians array is required and must contain at least one technician"),
    body("technicians.*.technicianClerkId")
      .notEmpty()
      .withMessage("Technician Clerk ID is required"),
    body("technicians.*.role")
      .isIn(["lead", "assistant"])
      .withMessage("Role must be either 'lead' or 'assistant'"),
    body("expectedDurationInMinutes")
      .isInt({ min: 1 })
      .withMessage("Expected duration must be a positive integer"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.scheduleService
);

/**
 * @swagger
 * /service-tasks/servicing/{taskId}/start:
 *   post:
 *     summary: Start a servicing task
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the servicing task
 *     responses:
 *       200:
 *         description: Service started successfully
 *       404:
 *         description: Servicing task not found
 */
router.post(
  "/servicing/:taskId/start",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.startService
);

/**
 * @swagger
 * /service-tasks/servicing/{taskId}/complete:
 *   post:
 *     summary: Complete a servicing task
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the servicing task
 *     responses:
 *       200:
 *         description: Service completed successfully
 *       404:
 *         description: Servicing task not found
 */
router.post(
  "/servicing/:taskId/complete",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.completeService
);

/**
 * @swagger
 * /service-tasks/servicing/{taskId}/timeline:
 *   post:
 *     summary: Update the timeline of a servicing task
 *     tags:
 *       - Service Tasks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the servicing task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceTimelineEntry'
 *     responses:
 *       200:
 *         description: Service task timeline updated successfully
 *       404:
 *         description: Servicing task not found
 */
router.post(
  "/servicing/:taskId/timeline",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
    body("title")
      .notEmpty()
      .withMessage("Title is required"),
    body("comment")
      .notEmpty()
      .withMessage("Comment is required"),
    body("photoUrls")
      .isArray()
      .withMessage("Photo URLs must be an array"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.updateServiceTaskTimeline
);

module.exports = router;
