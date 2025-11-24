const db = require("../db");
const ServiceOrderTaskService = require("../../service/service_order_task.service");
const mongoose = require("mongoose");
const {
  ServiceOrder,
  InspectionTask,
  Booking,
  Bay
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
});
