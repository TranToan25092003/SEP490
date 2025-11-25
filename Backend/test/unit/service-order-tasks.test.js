const db = require("../db");
const ServiceOrderTaskService = require("../../service/service_order_task.service");
const mongoose = require("mongoose");
const {
  ServiceOrder,
  InspectionTask,
  ServicingTask,
  Booking
} = require("../../model");
const DomainError = require("../../errors/domainError");
const { BaySchedulingService } = require("../../service/bay_scheduling.service");
const { MediaAssetService } = require("../../service/media_asset.service");
const { beforeEach } = require("node:test");

jest.mock("../../service/notification.service");
jest.mock("../../service/media_asset.service");

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await db.closeDatabase();
});

afterEach(async () => {
  await db.clearDatabase();
});

describe("ServiceOrderTasks", () => {
  describe("scheduleInspection method", () => {
    const SERVICE_ORDER_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439013")
    ];

    const BAY_ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
    const START_TIME = new Date("2026-01-01T09:00:00Z");
    const END_TIME = new Date("2026-01-01T10:00:00Z");

    test("UC0001_serviceOrderNotFound", async () => {
      const promise = ServiceOrderTaskService.scheduleInspection(
        SERVICE_ORDER_IDS[1],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_ORDER_NOT_FOUND");
    });

    test("UC0002_serviceOrderNotInCreatedState", async () => {
      await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[2],
        status: "waiting_inspection",
        items: [],
      });

      const promise = ServiceOrderTaskService.scheduleInspection(
        SERVICE_ORDER_IDS[2],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([]); // return an empty array to simulate no conflict

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_ORDER_INVALID_STATE");
    });

    test("UC0003_tasksConflicting", async () => {
      await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "created",
        items: [],
      });

      const promise = ServiceOrderTaskService.scheduleInspection(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([{}]); // return a non-empty array to simulate conflict

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("BAYS_UNAVAILABLE");
    });

    test("UC0004_successfulScheduling", async () => {
      await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "created",
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
      });

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([]); // return an empty array to simulate no conflict

      const result = await ServiceOrderTaskService.scheduleInspection(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      expect(result).toBeDefined();
      expect(result.serviceOrderStatus).toBe("waiting_inspection");
      expect(result.status).toBe("scheduled");
      expect(result.assignedBayId.toString()).toBe(BAY_ID.toString());
      expect(result.expectedStartTime).toBe(START_TIME.toISOString());
      expect(result.expectedEndTime).toBe(END_TIME.toISOString());
    });
  });

  describe("beginInspectionTask method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    ];

    const TECHNICIAN_INFO_ARRAY = [
      {
        technicianClerkId: "user_2NNEqL2nrirlMX0wEVAYdbq58BG",
        role: "lead",
      },
    ];

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.beginInspectionTask(
        TASK_IDS[1],
        TECHNICIAN_INFO_ARRAY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_taskNotInScheduledState", async () => {
      const booking = await Booking.collection.insertOne({
        status: "checked_in",
      });

      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "waiting_inspection",
        booking_id: booking.insertedId,
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        status: "in_progress",
        __t: "inspection"
      });

      const promise = ServiceOrderTaskService.beginInspectionTask(
        TASK_IDS[0],
        TECHNICIAN_INFO_ARRAY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_INVALID_STATE");
    });

    test("UC0003_successfulBegin", async () => {
      // successful always have more set up
      const booking = await Booking.collection.insertOne({
        status: "checked_in",
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        vehicle_id: new mongoose.Types.ObjectId(),
        customer_clerk_id: "customer_12345"
      });

      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "waiting_inspection",
        booking_id: booking.insertedId,
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        status: "scheduled",
        __t: "inspection"
      });

      const result = await ServiceOrderTaskService.beginInspectionTask(
        TASK_IDS[0],
        TECHNICIAN_INFO_ARRAY
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("in_progress");
      expect(result.assignedTechnicians).toHaveLength(1);
      expect(result.assignedTechnicians[0].technicianClerkId).toBe(
        TECHNICIAN_INFO_ARRAY[0].technicianClerkId
      );
      expect(result.assignedTechnicians[0].role).toBe(
        TECHNICIAN_INFO_ARRAY[0].role
      );
      const updatedBooking = await Booking.findById(booking.insertedId).exec();
      expect(updatedBooking.status).toBe("in_progress");
    });
  });

  describe("completeInspection method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    ];

    const PAYLOAD = {
      comment: "Inspect OK",
      media: [
        {
          url: "<cloudinary image url>",
          kind: "image",
          publicId: "<cloudinary image id>"
        }
      ]
    };

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.completeInspection(
        TASK_IDS[1],
        PAYLOAD
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_taskNotInProgressState", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "waiting_inspection",
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        status: "scheduled",
        __t: "inspection"
      });

      const promise = ServiceOrderTaskService.completeInspection(
        TASK_IDS[0],
        PAYLOAD
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_INVALID_STATE");
    });

    test("UC0003_successfulCompletion", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "waiting_inspection",
        staff_clerk_id: "test-staff-clerk-id",
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        actual_start_time: new Date(),
        status: "in_progress",
        __t: "inspection"
      });

      const ID = new mongoose.Types.ObjectId();

      MediaAssetService.saveMediaAsset = jest
        .fn()
        .mockResolvedValue([ID.toString()]);

      const result = await ServiceOrderTaskService.completeInspection(
        TASK_IDS[0],
        PAYLOAD
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("completed");
      expect(result.comment).toBe(PAYLOAD.comment);
      expect(result.media[0].toString()).toEqual(ID.toString());
      expect(result.actualEndTime).toBeDefined();

      const updatedServiceOrder = await ServiceOrder.findById(serviceOrder.insertedId).exec();
      expect(updatedServiceOrder.status).toBe("inspection_completed");
    });
  });

  describe("updateInspection method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439066"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439999"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439998"),
    ];

    const PAYLOAD = {
      comment: "Inspect OK",
      media: [
        {
          url: "<cloudinary image url>",
          kind: "image",
          publicId: "<cloudinary image id>"
        }
      ]
    };

     test("UC0001_taskNotInProgressState", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "inspection_completed",
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[2],
        status: "scheduled",
        __t: "inspection",
        service_order_id: serviceOrder.insertedId,
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
      });

      const ID = new mongoose.Types.ObjectId();

      MediaAssetService.saveMediaAsset = jest
        .fn()
        .mockResolvedValue([ID.toString()]);

      const result = await ServiceOrderTaskService.updateInspection(
        TASK_IDS[2],
        PAYLOAD
      );

      expect(result).toBeDefined();
      expect(result.comment).toBe(PAYLOAD.comment);
      expect(result.media[0].toString()).toEqual(ID.toString());
    });

    test("UC0002_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.updateInspection(
        TASK_IDS[1],
        PAYLOAD
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0003_taskExistsAndInProgress", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "waiting_inspection",
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
      });

      await InspectionTask.collection.insertOne({
        _id: TASK_IDS[2],
        service_order_id: serviceOrder.insertedId,
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        actual_start_time: new Date(),
        status: "in_progress",
        __t: "inspection",
        assigned_technicians: [],
        comment: "",
        media: [],
      });

      const ID = new mongoose.Types.ObjectId();

      MediaAssetService.saveMediaAsset = jest
        .fn()
        .mockResolvedValue([ID.toString()]);

      const result = await ServiceOrderTaskService.updateInspection(
        TASK_IDS[2],
        PAYLOAD
      );

      expect(result).toBeDefined();
      expect(result.comment).toBe(PAYLOAD.comment);
      expect(result.media[0].toString()).toEqual(ID.toString());
    });
  });

  describe("scheduleService method", () => {
    const SERVICE_ORDER_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
    ];

    const BAY_ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
    const START_TIME = new Date("2026-01-01T09:00:00Z");
    const END_TIME = new Date("2026-01-01T10:00:00Z");

    test("UC0001_serviceOrderNotFound", async () => {
      const promise = ServiceOrderTaskService.scheduleService(
        SERVICE_ORDER_IDS[1],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_ORDER_NOT_FOUND");
    });

    test("UC0002_serviceOrderNotInValidState", async () => {
      await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "created",
        items: [],
      });

      const promise = ServiceOrderTaskService.scheduleService(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_ORDER_INVALID_STATE");
    });

    test("UC0003_tasksConflicting_InspectionCompleted", async () => {
      await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "inspection_completed",
        items: [],
      });

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }]);

      const promise = ServiceOrderTaskService.scheduleService(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("BAYS_UNAVAILABLE");
    });

    test("UC0004_successfulScheduling_InspectionCompleted", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "inspection_completed",
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
        booking_id: new mongoose.Types.ObjectId(),
      });

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await ServiceOrderTaskService.scheduleService(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("scheduled");
      expect(result.assignedBayId.toString()).toBe(BAY_ID.toString());
      expect(result.expectedStartTime).toBe(START_TIME.toISOString());
      expect(result.expectedEndTime).toBe(END_TIME.toISOString());

      const updatedServiceOrder = await ServiceOrder.findById(serviceOrder.insertedId).exec();
      expect(updatedServiceOrder.status).toBe("scheduled");
    });

    test("UC0005_successfulScheduling_Approved", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        _id: SERVICE_ORDER_IDS[0],
        status: "approved",
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
        booking_id: new mongoose.Types.ObjectId(),
      });

      BaySchedulingService.findOverlappingTasksForBayId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await ServiceOrderTaskService.scheduleService(
        SERVICE_ORDER_IDS[0],
        BAY_ID,
        START_TIME,
        END_TIME
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("scheduled");
      expect(result.assignedBayId.toString()).toBe(BAY_ID.toString());
      expect(result.expectedStartTime).toBe(START_TIME.toISOString());
      expect(result.expectedEndTime).toBe(END_TIME.toISOString());

      const updatedServiceOrder = await ServiceOrder.findById(serviceOrder.insertedId).exec();
      expect(updatedServiceOrder.status).toBe("scheduled");
    });
  });

  describe("startService method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    ];

    const TECHNICIAN_INFO_ARRAY = [
      {
        technicianClerkId: "user_2NNEqL2nrirlMX0wEVAYdbq58BG",
        role: "lead",
      },
    ];

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.startService(
        TASK_IDS[1],
        TECHNICIAN_INFO_ARRAY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_taskNotInScheduledState", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        _id: TASK_IDS[0],
        status: "scheduled",
        __t: "servicing",
      });

      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        status: "in_progress",
        __t: "servicing",
      });

      const promise = ServiceOrderTaskService.startService(
        TASK_IDS[0],
        TECHNICIAN_INFO_ARRAY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_INVALID_STATE");
    });

    test("UC0003_successfulStart", async () => {
      const booking = await Booking.collection.insertOne({
        status: "checked_in",
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        vehicle_id: new mongoose.Types.ObjectId(),
        customer_clerk_id: "customer_12345",
      });

      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "scheduled",
        booking_id: booking.insertedId,
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
      });

      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        status: "scheduled",
        __t: "servicing",
        assigned_technicians: [],
        timeline: [],
      });

      const result = await ServiceOrderTaskService.startService(
        TASK_IDS[0],
        TECHNICIAN_INFO_ARRAY
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("in_progress");
      expect(result.assignedTechnicians).toHaveLength(1);
      expect(result.assignedTechnicians[0].technicianClerkId).toBe(
        TECHNICIAN_INFO_ARRAY[0].technicianClerkId
      );
      expect(result.assignedTechnicians[0].role).toBe(
        TECHNICIAN_INFO_ARRAY[0].role
      );

      const updatedServiceOrder = await ServiceOrder.findById(serviceOrder.insertedId).exec();
      expect(updatedServiceOrder.status).toBe("servicing");
    });
  });

  describe("completeService method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439055"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439999"),
    ];

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.completeService(TASK_IDS[1]);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_taskNotInProgressState", async () => {
      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "servicing",
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
      });

      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        status: "scheduled",
        __t: "servicing"
      });

      const promise = ServiceOrderTaskService.completeService(TASK_IDS[0]);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_INVALID_STATE");
    });

    test("UC0003_taskInProgressState", async () => {
      const booking = await Booking.collection.insertOne({
        status: "in_progress",
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        vehicle_id: new mongoose.Types.ObjectId(),
        customer_clerk_id: "customer_12345",
      });

      const serviceOrder = await ServiceOrder.collection.insertOne({
        status: "servicing",
        booking_id: booking.insertedId,
        items: [],
        staff_clerk_id: "test-staff-clerk-id",
      });

      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        service_order_id: serviceOrder.insertedId,
        status: "in_progress",
        __t: "servicing",
        assigned_technicians: [],
        timeline: [],
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        assigned_bay_id: new mongoose.Types.ObjectId(),
      });

      const result = await ServiceOrderTaskService.completeService(TASK_IDS[0]);

      expect(result).toBeDefined();
      expect(result.status).toBe("completed");

      const updatedServiceOrder = await ServiceOrder.findById(serviceOrder.insertedId).exec();
      expect(updatedServiceOrder.status).toBe("completed");

      const updatedBooking = await Booking.findById(booking.insertedId).exec();
      expect(updatedBooking.status).toBe("completed");
    });
  });

  describe("updateServiceTaskTimeline method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    ];

    const ENTRY = {
      title: "Stage 1 Complete",
      comment: "Everything looks good",
      media: [
        {
          url: "<cloudinary image url>",
          kind: "image",
          publicId: "<cloudinary public id>"
        }
      ]
    };

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.updateServiceTaskTimeline(
        TASK_IDS[1],
        ENTRY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_successfulAddition", async () => {
      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        timeline: [],
        __t: "servicing",
        service_order_id: new mongoose.Types.ObjectId(),
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        status: "in_progress",
        assigned_technicians: [],
      });

      const ID = new mongoose.Types.ObjectId();

      MediaAssetService.saveMediaAsset = jest
        .fn()
        .mockResolvedValue([ID.toString()]);

      const result = await ServiceOrderTaskService.updateServiceTaskTimeline(
        TASK_IDS[0],
        ENTRY
      );

      expect(result).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBeGreaterThan(0);

      const newEntry = result.timeline.find(
        entry => entry.title === ENTRY.title
      );
      expect(newEntry).toBeDefined();
      expect(newEntry.comment).toBe(ENTRY.comment);
    });
  });

  describe("updateServiceTaskTimelineEntry method", () => {
    const TASK_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    ];

    const ENTRY_IDS = [
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439022"),
      new mongoose.Types.ObjectId("507f1f77bcf86cd799439029"),
    ];

    const ENTRY = {
      title: "Stage 1 Complete",
      comment: "Everything looks good",
      media: [
        {
          url: "<cloudinary image url>",
          kind: "image",
          publicId: "<cloudinary public id>"
        }
      ]
    };

    test("UC0001_taskNotFound", async () => {
      const promise = ServiceOrderTaskService.updateServiceTaskTimelineEntry(
        TASK_IDS[1],
        ENTRY_IDS[0],
        ENTRY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0002_entryNotFound", async () => {
      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        timeline: [],
        __t: "servicing"
      });

      const promise = ServiceOrderTaskService.updateServiceTaskTimelineEntry(
        TASK_IDS[0],
        ENTRY_IDS[1],
        ENTRY
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("SERVICE_TASK_NOT_FOUND");
    });

    test("UC0003_successfulUpdate", async () => {
      await ServicingTask.collection.insertOne({
        _id: TASK_IDS[0],
        __t: "servicing",
        service_order_id: new mongoose.Types.ObjectId(),
        assigned_bay_id: new mongoose.Types.ObjectId(),
        expected_start_time: new Date(),
        expected_end_time: new Date(),
        status: "in_progress",
        assigned_technicians: [],
        timeline: [
          {
            _id: ENTRY_IDS[0],
            title: "Old Title",
            comment: "Old comment",
            media: [],
            timestamp: new Date(),
          },
        ],
      });

      const ID = new mongoose.Types.ObjectId();

      MediaAssetService.saveMediaAsset = jest
        .fn()
        .mockResolvedValue([ID.toString()]);

      const result = await ServiceOrderTaskService.updateServiceTaskTimelineEntry(
        TASK_IDS[0],
        ENTRY_IDS[0],
        ENTRY
      );

      expect(result).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBeGreaterThan(0);

      const updatedEntry = result.timeline.find(
        entry => entry.title === ENTRY.title
      );
      expect(updatedEntry).toBeDefined();
      expect(updatedEntry.comment).toBe(ENTRY.comment);
    });
  });
});

