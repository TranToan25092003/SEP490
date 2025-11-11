const express = require("express");
const { body, param } = require("express-validator");
const serviceOrderTaskController = require("../controller/service-order-task.controller");
const {
  throwErrors,
} = require("../middleware/validate-data/throwErrors.middleware");
const { authenticate } = require("../middleware/guards/authen.middleware");
const router = express.Router();

const mediaValidation = [
  body("media").isArray().withMessage("Media must be an array"),
  body("media.*.url")
    .notEmpty()
    .withMessage("Media URL is required")
    .isURL()
    .withMessage("Media URL must be a valid URL"),
  body("media.*.kind")
    .isIn(["image", "video", "pdf", "other"])
    .withMessage(
      "Media type must be either 'photo', 'video', 'pdf', or 'other'"
    ),
  body("media.*.publicId")
    .notEmpty()
    .withMessage("Media public ID is required")
    .isString()
    .withMessage("Media public ID must be a string"),
];

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
 *               - bayId
 *               - start
 *               - end
 *             properties:
 *               bayId:
 *                 type: string
 *                 description: The ID of the bay to schedule the inspection in
 *               start:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the inspection
 *               end:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the inspection
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
    body("bayId")
      .notEmpty()
      .withMessage("Bay ID is required")
      .isMongoId()
      .withMessage("Bay ID must be a valid MongoDB ObjectId"),
    body("start")
      .notEmpty()
      .withMessage("Start time is required")
      .isISO8601()
      .withMessage("Start time must be a valid ISO 8601 date-time"),
    body("end")
      .notEmpty()
      .withMessage("End time is required")
      .isISO8601()
      .withMessage("End time must be a valid ISO 8601 date-time"),
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicians
 *             properties:
 *               technicians:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechnicianInfo'
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
    body("technicians")
      .isArray({ min: 1 })
      .withMessage(
        "Technicians array is required and must contain at least one technician"
      ),
    body("technicians.*.technicianClerkId")
      .notEmpty()
      .withMessage("Technician Clerk ID is required"),
    body("technicians.*.role")
      .isIn(["lead", "assistant"])
      .withMessage("Role must be either 'lead' or 'assistant'"),
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
    body("comment").notEmpty().withMessage("Comment is required"),
    ...mediaValidation,
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.completeInspection
);

/**
 * @swagger
 * /service-tasks/inspection/{taskId}:
 *   put:
 *     summary: Update an inspection task
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
 *         description: Inspection completed successfully
 *       404:
 *         description: Inspection task not found
 */
router.put(
  "/inspection/:taskId",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
    body("comment").notEmpty().withMessage("Comment is required"),
    ...mediaValidation,
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.updateInspection
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
 *               - bayId
 *               - start
 *               - end
 *             properties:
 *               bayId:
 *                 type: string
 *                 description: The ID of the bay to schedule the servicing in
 *               start:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the servicing
 *               end:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the servicing
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
    body("bayId")
      .notEmpty()
      .withMessage("Bay ID is required")
      .isMongoId()
      .withMessage("Bay ID must be a valid MongoDB ObjectId"),
    body("start")
      .notEmpty()
      .withMessage("Start time is required")
      .isISO8601()
      .withMessage("Start time must be a valid ISO 8601 date-time"),
    body("end")
      .notEmpty()
      .withMessage("End time is required")
      .isISO8601()
      .withMessage("End time must be a valid ISO 8601 date-time"),
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicians
 *             properties:
 *               technicians:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TechnicianInfo'
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
    body("technicians")
      .isArray({ min: 1 })
      .withMessage(
        "Technicians array is required and must contain at least one technician"
      ),
    body("technicians.*.technicianClerkId")
      .notEmpty()
      .withMessage("Technician Clerk ID is required"),
    body("technicians.*.role")
      .isIn(["lead", "assistant"])
      .withMessage("Role must be either 'lead' or 'assistant'"),
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
    body("title").notEmpty().withMessage("Title is required"),
    body("comment").notEmpty().withMessage("Comment is required"),
    ...mediaValidation,
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.updateServiceTaskTimeline
);

/**
 * @swagger
 * /service-tasks/servicing/{taskId}/timeline/{entryId}:
 *  put:
 *     summary: Update a timeline entry of a servicing task
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
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the timeline entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceTimelineEntry'
 *     responses:
 *       200:
 *         description: Service task timeline entry updated successfully
 *       404:
 *         description: Servicing task or timeline entry not found
 *
 */
router.put(
  "/servicing/:taskId/timeline/:entryId",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
    param("entryId")
      .notEmpty()
      .withMessage("Entry ID is required")
      .isMongoId()
      .withMessage("Entry ID must be a valid MongoDB ObjectId"),
    body("title").notEmpty().withMessage("Title is required"),
    body("comment").notEmpty().withMessage("Comment is required"),
    ...mediaValidation,
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.updateServiceTaskTimelineEntry
);

/**
 * @swagger
 * /service-tasks/servicing/{taskId}/timeline/{entryId}:
 *   get:
 *     summary: Get a timeline entry of a servicing task
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
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the timeline entry
 *     responses:
 *       200:
 *         description: Service task timeline entry retrieved successfully
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ServiceTimelineEntryDTO
 *       404:
 *         description: Servicing task or timeline entry not found
 */
router.get(
  "/servicing/:taskId/timeline/:entryId",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
    param("entryId")
      .notEmpty()
      .withMessage("Entry ID is required")
      .isMongoId()
      .withMessage("Entry ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.getServiceTaskTimelineEntry
);

router.get(
  "/tasks-for-service-order/:serviceOrderId",
  [
    param("serviceOrderId")
      .notEmpty()
      .withMessage("Service order ID is required")
      .isMongoId()
      .withMessage("Service order ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.getAllTasksForServiceOrder
);

router.get(
  "/:taskId",
  [
    param("taskId")
      .notEmpty()
      .withMessage("Task ID is required")
      .isMongoId()
      .withMessage("Task ID must be a valid MongoDB ObjectId"),
  ],
  throwErrors,
  authenticate,
  serviceOrderTaskController.getTaskDetails
);

module.exports = router;
