const mongoose = require("mongoose");
const db = require("../db");
const DomainError = require("../../errors/domainError");

jest.mock("../../service/bookings.service", () => ({
  createBooking: jest.fn(),
}));

jest.mock("../../service/service_order.service", () => ({
  getServiceOrderById: jest.fn(),
}));

jest.mock("../../service/notification.service", () => ({
  notifyWarrantyBookingSuccess: jest.fn(),
}));

const bookingsService = require("../../service/bookings.service");
const ServiceOrderService = require("../../service/service_order.service");
const notificationService = require("../../service/notification.service");

const { Warranty, Service } = require("../../model");
const {
  WarrantyService,
  ERROR_CODES,
} = require("../../service/warranty.service");

describe("WarrantyService", () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await db.clearDatabase();
  });

  // Tests for getOrCreateWarrantyService đã được bỏ theo yêu cầu

  describe("checkWarrantyEligibility", () => {
    const SERVICE_ORDER_IDS = {
      notFound: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      alreadyWarrantied: new mongoose.Types.ObjectId(
        "507f1f77bcf86cd799439012"
      ),
      notCompleted: new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
      missingCompletedAt: new mongoose.Types.ObjectId(
        "507f1f77bcf86cd799439014"
      ),
      expired: new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
      eligible: new mongoose.Types.ObjectId("507f1f77bcf86cd799439016"),
      exactlySevenDays: new mongoose.Types.ObjectId("507f1f77bcf86cd799439017"),
      expiredReportDays: new mongoose.Types.ObjectId(
        "507f1f77bcf86cd799439018"
      ),
      completedAtReturned: new mongoose.Types.ObjectId(
        "507f1f77bcf86cd799439019"
      ),
    };

    test("UTCID01_serviceOrderNotFound", async () => {
      ServiceOrderService.getServiceOrderById.mockResolvedValue(null);

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.notFound.toString()
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("không tồn tại");
    });

    test("UTCID02_alreadyHasWarranty", async () => {
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.alreadyWarrantied.toString(),
        status: "completed",
        completedAt: new Date(),
      });

      await Warranty.create({
        so_id: SERVICE_ORDER_IDS.alreadyWarrantied,
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.alreadyWarrantied
      );

      expect(result.eligible).toBe(false);
      expect(result.alreadyWarrantied).toBe(true);
    });

    test("UTCID03_serviceOrderNotCompleted", async () => {
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.notCompleted.toString(),
        status: "servicing",
        completedAt: null,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.notCompleted
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("đã hoàn thành");
    });

    test("UTCID04_completedDateMissing", async () => {
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.missingCompletedAt.toString(),
        status: "completed",
        completedAt: null,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.missingCompletedAt
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("ngày hoàn thành");
    });

    test("UTCID05_warrantyExpiredAfterSevenDays", async () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.expired.toString(),
        status: "completed",
        completedAt: pastDate,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.expired
      );

      expect(result.eligible).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.daysSinceCompletion).toBeGreaterThan(7);
    });

    test("UTCID06_eligibleWithinSevenDays", async () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.eligible.toString(),
        status: "completed",
        completedAt: recentDate,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.eligible
      );

      expect(result.eligible).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysSinceCompletion).toBe(2);
    });

    test("UTCID07_exactlySevenDaysStillEligible", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.exactlySevenDays.toString(),
        status: "completed",
        completedAt: sevenDaysAgo,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.exactlySevenDays
      );

      expect(result.eligible).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    test("UTCID08_includesDaysSinceCompletionWhenExpired", async () => {
      const pastDate = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.expiredReportDays.toString(),
        status: "completed",
        completedAt: pastDate,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.expiredReportDays
      );

      expect(result.eligible).toBe(false);
      expect(result.daysSinceCompletion).toBeGreaterThan(7);
    });

    test("UTCID09_returnsCompletedAtField", async () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: SERVICE_ORDER_IDS.completedAtReturned.toString(),
        status: "completed",
        completedAt: recentDate,
      });

      const result = await WarrantyService.checkWarrantyEligibility(
        SERVICE_ORDER_IDS.completedAtReturned
      );

      expect(result.eligible).toBe(true);
      expect(result.completedAt).toEqual(recentDate);
    });
  });

  describe("createWarrantyBooking", () => {
    const customerClerkId = "user_test";
    const vehicleId = new mongoose.Types.ObjectId();
    const serviceOrderId = new mongoose.Types.ObjectId();
    const bookingId = new mongoose.Types.ObjectId();
    const partId = new mongoose.Types.ObjectId();
    const timeSlot = { year: 2030, month: 1, day: 5, hours: 10, minutes: 0 };

    test("UTCID01_warrantyAlreadyExists", async () => {
      await Warranty.create({
        so_id: serviceOrderId,
        vehicle_id: vehicleId,
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      await expect(
        WarrantyService.createWarrantyBooking({
          customerClerkId,
          vehicleId,
          serviceOrderId,
          selectedParts: [],
          timeSlot,
        })
      ).rejects.toThrow(DomainError);

      const error = await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [],
        timeSlot,
      }).catch((err) => err);

      expect(error.errorCode).toBe(ERROR_CODES.WARRANTY_ALREADY_EXISTS);
    });

    test("UTCID02_eligibilityCheckFails", async () => {
      const spy = jest
        .spyOn(WarrantyService, "checkWarrantyEligibility")
        .mockResolvedValue({
          eligible: false,
          reason: "Đơn chưa hoàn thành",
          daysSinceCompletion: 0,
        });

      await expect(
        WarrantyService.createWarrantyBooking({
          customerClerkId,
          vehicleId,
          serviceOrderId,
          selectedParts: [],
          timeSlot,
        })
      ).rejects.toThrow(DomainError);

      const error = await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [],
        timeSlot,
      }).catch((err) => err);

      expect(error.errorCode).toBe(ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED);
      expect(bookingsService.createBooking).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test("UTCID03_invalidPartSelection", async () => {
      const now = new Date();
      ServiceOrderService.getServiceOrderById
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          status: "completed",
          completedAt: now,
        })
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          items: [
            { type: "part", partId: new mongoose.Types.ObjectId().toString() },
          ],
        });

      bookingsService.createBooking.mockResolvedValue({
        _id: bookingId,
        slot_start_time: new Date(),
      });

      await expect(
        WarrantyService.createWarrantyBooking({
          customerClerkId,
          vehicleId,
          serviceOrderId,
          selectedParts: [
            { partId: partId.toString(), partName: "Lọc dầu", quantity: 1 },
          ],
          timeSlot,
        })
      ).rejects.toMatchObject({
        errorCode: ERROR_CODES.INVALID_PART_SELECTION,
      });
    });

    test("UTCID04_successfulWarrantyBooking", async () => {
      const now = new Date();
      const selectedPart = {
        partId: partId.toString(),
        partName: "Lọc dầu",
        quantity: 2,
      };

      ServiceOrderService.getServiceOrderById
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          status: "completed",
          completedAt: now,
        })
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          items: [{ type: "part", partId: partId.toString() }],
        });

      bookingsService.createBooking.mockResolvedValue({
        _id: bookingId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        status: "booked",
      });

      notificationService.notifyWarrantyBookingSuccess.mockResolvedValue();

      const result = await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [selectedPart],
        timeSlot,
      });

      expect(result).toBeDefined();
      expect(result.booking._id.toString()).toBe(bookingId.toString());
      expect(result.warranty.vehicle_id.toString()).toBe(vehicleId.toString());
      expect(result.warranty.warranty_parts).toHaveLength(1);
      expect(result.warranty.warranty_parts[0].part_id.toString()).toBe(
        partId.toString()
      );

      expect(bookingsService.createBooking).toHaveBeenCalledWith(
        customerClerkId,
        vehicleId,
        expect.any(Array),
        timeSlot
      );
      expect(
        notificationService.notifyWarrantyBookingSuccess
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.any(Object),
          serviceOrderId,
        })
      );
    });

    test("UTCID05_defaultsQuantityToOneWhenMissing", async () => {
      const now = new Date();
      const partWithoutQuantity = {
        partId: partId.toString(),
        partName: "Má phanh",
      };

      ServiceOrderService.getServiceOrderById
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          status: "completed",
          completedAt: now,
        })
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          items: [{ type: "part", partId: partId.toString() }],
        });

      bookingsService.createBooking.mockResolvedValue({
        _id: bookingId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        status: "booked",
      });

      notificationService.notifyWarrantyBookingSuccess.mockResolvedValue();

      const result = await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [partWithoutQuantity],
        timeSlot,
      });

      expect(result.warranty.warranty_parts[0].quantity).toBe(1);
    });

    test("UTCID06_handlesBookingCreationFailure", async () => {
      const now = new Date();
      ServiceOrderService.getServiceOrderById
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          status: "completed",
          completedAt: now,
        })
        .mockResolvedValueOnce({
          id: serviceOrderId.toString(),
          items: [{ type: "part", partId: partId.toString() }],
        });

      bookingsService.createBooking.mockRejectedValue(
        new Error("Booking failed")
      );

      await expect(
        WarrantyService.createWarrantyBooking({
          customerClerkId,
          vehicleId,
          serviceOrderId,
          selectedParts: [
            { partId: partId.toString(), partName: "Lọc dầu", quantity: 1 },
          ],
          timeSlot,
        })
      ).rejects.toThrow("Booking failed");
    });

    test("UTCID07_sendsNotificationAfterSuccess", async () => {
      const eligibilitySpy = jest
        .spyOn(WarrantyService, "checkWarrantyEligibility")
        .mockResolvedValue({
          eligible: true,
          daysRemaining: 5,
          daysSinceCompletion: 2,
        });

      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: serviceOrderId.toString(),
        items: [{ type: "part", partId: partId.toString() }],
      });

      bookingsService.createBooking.mockResolvedValue({
        _id: bookingId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        status: "booked",
      });

      notificationService.notifyWarrantyBookingSuccess.mockResolvedValue();

      await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [
          { partId: partId.toString(), partName: "Lọc dầu", quantity: 1 },
        ],
        timeSlot,
      });

      expect(
        notificationService.notifyWarrantyBookingSuccess
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.any(Object),
          serviceOrderId,
        })
      );

      eligibilitySpy.mockRestore();
    });

    test("UTCID08_persistsWarrantyDescription", async () => {
      const eligibilitySpy = jest
        .spyOn(WarrantyService, "checkWarrantyEligibility")
        .mockResolvedValue({
          eligible: true,
          daysRemaining: 6,
          daysSinceCompletion: 1,
        });

      const secondPartId = new mongoose.Types.ObjectId();

      ServiceOrderService.getServiceOrderById.mockResolvedValue({
        id: serviceOrderId.toString(),
        items: [
          { type: "part", partId: partId.toString() },
          { type: "part", partId: secondPartId.toString() },
        ],
      });

      bookingsService.createBooking.mockResolvedValue({
        _id: bookingId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
        status: "booked",
      });

      notificationService.notifyWarrantyBookingSuccess.mockResolvedValue();

      const result = await WarrantyService.createWarrantyBooking({
        customerClerkId,
        vehicleId,
        serviceOrderId,
        selectedParts: [
          { partId: partId.toString(), partName: "Má phanh", quantity: 1 },
          { partId: secondPartId.toString(), partName: "Lọc dầu", quantity: 1 },
        ],
        timeSlot,
      });

      expect(result.warranty.description).toContain("2 phụ tùng");

      eligibilitySpy.mockRestore();
    });
  });

  describe("markWarrantyAsUsed", () => {
    test("UTCID01_warrantyNotFound", async () => {
      await expect(
        WarrantyService.markWarrantyAsUsed(new mongoose.Types.ObjectId())
      ).rejects.toThrow(DomainError);
    });

    test("UTCID02_returnsErrorCodeWhenNotFound", async () => {
      const error = await WarrantyService.markWarrantyAsUsed(
        new mongoose.Types.ObjectId()
      ).catch((err) => err);

      expect(error.errorCode).toBe(ERROR_CODES.WARRANTY_NOT_FOUND);
    });

    test("UTCID03_updatesActiveWarrantyToUsed", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      const result = await WarrantyService.markWarrantyAsUsed(warranty._id);

      expect(result.status).toBe("used");
      const inDb = await Warranty.findById(warranty._id);
      expect(inDb.status).toBe("used");
    });

    test("UTCID04_updatesExpiredWarrantyToUsed", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "expired",
        warranty_parts: [],
      });

      const result = await WarrantyService.markWarrantyAsUsed(warranty._id);

      expect(result.status).toBe("used");
    });

    test("UTCID05_persistsUpdatedTimestamp", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      const beforeUpdatedAt = warranty.updatedAt;
      await WarrantyService.markWarrantyAsUsed(warranty._id);
      const refreshed = await Warranty.findById(warranty._id);

      expect(refreshed.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime()
      );
    });

    test("UTCID06_noOpWhenAlreadyUsed", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "used",
        warranty_parts: [],
      });

      const result = await WarrantyService.markWarrantyAsUsed(warranty._id);

      expect(result.status).toBe("used");
    });

    test("UTCID07_handlesDatabaseErrors", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      const originalSave = Warranty.prototype.save;
      Warranty.prototype.save = jest
        .fn()
        .mockRejectedValue(new Error("DB write failed"));

      await expect(
        WarrantyService.markWarrantyAsUsed(warranty._id)
      ).rejects.toThrow("DB write failed");

      Warranty.prototype.save = originalSave;
    });

    test("UTCID08_returnsWarrantyDocument", async () => {
      const warranty = await Warranty.create({
        so_id: new mongoose.Types.ObjectId(),
        vehicle_id: new mongoose.Types.ObjectId(),
        booking_id: new mongoose.Types.ObjectId(),
        start_date: new Date(),
        end_date: new Date(),
        status: "active",
        warranty_parts: [],
      });

      const result = await WarrantyService.markWarrantyAsUsed(warranty._id);

      expect(result).toHaveProperty("_id");
      expect(result.status).toBe("used");
    });
  });
});
