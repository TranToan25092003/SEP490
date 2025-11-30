const db = require("../db");
const mongoose = require("mongoose");
const DomainError = require("../../errors/domainError");

const {
  InvoiceService,
  ERROR_CODES,
} = require("../../service/invoice.service");
const { Invoice, ServiceOrder, Booking, Vehicle } = require("../../model");

// Mock external dependencies
jest.mock("../../service/users.service", () => ({
  UsersService: {
    getFullNamesByIds: jest.fn(),
  },
}));

jest.mock("../../service/notification.service", () => ({
  notifyPaymentSuccess: jest.fn(),
}));

const { UsersService } = require("../../service/users.service");
const notificationService = require("../../service/notification.service");

describe("InvoiceService", () => {
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

  describe("listInvoicesForCustomer", () => {
    const CUSTOMER_ID = "user_customer_001";
    const OTHER_CUSTOMER_ID = "user_customer_002";

    test("UC0001_noInvoicesReturnsEmptyArray", async () => {
      const result = await InvoiceService.listInvoicesForCustomer(CUSTOMER_ID);
      expect(result).toEqual([]);
      expect(UsersService.getFullNamesByIds).not.toHaveBeenCalled();
    });

    test("UC0002_invoicesExistButNoneForCustomerReturnsEmptyArray", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: OTHER_CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "unpaid",
      });

      const result = await InvoiceService.listInvoicesForCustomer(CUSTOMER_ID);

      expect(result).toEqual([]);
      expect(UsersService.getFullNamesByIds).not.toHaveBeenCalled();
    });

    test("UC0003_singleInvoiceForCustomerMappedToSummary", async () => {
      const vehicleId = new mongoose.Types.ObjectId();
      await Vehicle.collection.insertOne({
        _id: vehicleId,
        license_plate: "30A-12345",
      });
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: vehicleId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const invoiceInsert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 200000,
        subtotal: 180000,
        tax: 20000,
        status: "unpaid",
      });
      const invoiceId = invoiceInsert.insertedId;

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Nguyen Van A",
      });

      const result = await InvoiceService.listInvoicesForCustomer(CUSTOMER_ID);

      expect(result).toHaveLength(1);
      const summary = result[0];
      expect(summary.id).toBe(invoiceId.toString());
      expect(summary.totalAmount).toBe(200000);
      expect(summary.customerName).toBe("Nguyen Van A");
      expect(summary.licensePlate).toBe("30A-12345");
    });

    test("UC0004_filtersInvoicesByCustomerWhenMultipleExist", async () => {
      const vehicleId1 = new mongoose.Types.ObjectId();
      const vehicleId2 = new mongoose.Types.ObjectId();
      await Vehicle.collection.insertMany([
        { _id: vehicleId1, license_plate: "30A-11111" },
        { _id: vehicleId2, license_plate: "30A-22222" },
      ]);

      const bookingInsert1 = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: vehicleId1,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const bookingInsert2 = await Booking.collection.insertOne({
        customer_clerk_id: OTHER_CUSTOMER_ID,
        vehicle_id: vehicleId2,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });

      const soInsert1 = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert1.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const soInsert2 = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert2.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });

      await Invoice.collection.insertOne({
        service_order_id: soInsert1.insertedId,
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "unpaid",
      });
      await Invoice.collection.insertOne({
        service_order_id: soInsert2.insertedId,
        amount: 300000,
        subtotal: 300000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Customer A",
      });

      const result = await InvoiceService.listInvoicesForCustomer(CUSTOMER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe("Customer A");
      expect(result[0].totalAmount).toBe(100000);
    });

    test("UC0005_generatesInvoiceAndOrderNumbersWhenMissing", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const invoiceInsert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 500000,
        subtotal: 500000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Customer A",
      });

      const [summary] = await InvoiceService.listInvoicesForCustomer(
        CUSTOMER_ID
      );

      expect(summary.invoiceNumber).toMatch(/^HD\d{6}$/);
      expect(summary.serviceOrderNumber).toMatch(/^SC\d{6}$/);

      const refreshedInvoice = await Invoice.findById(
        invoiceInsert.insertedId
      ).exec();
      const refreshedSO = await ServiceOrder.findById(
        soInsert.insertedId
      ).exec();
      expect(refreshedInvoice.invoiceNumber).toBe(summary.invoiceNumber);
      expect(refreshedSO.orderNumber).toBe(summary.serviceOrderNumber);
    });

    test("UC0006_usesCustomerNameFromUsersService", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Customer From Service",
      });

      const [summary] = await InvoiceService.listInvoicesForCustomer(
        CUSTOMER_ID
      );

      expect(UsersService.getFullNamesByIds).toHaveBeenCalledWith([
        CUSTOMER_ID,
      ]);
      expect(summary.customerName).toBe("Customer From Service");
    });
  });

  describe("getInvoiceById", () => {
    test("UC0001_returnsNullWhenInvoiceNotFound", async () => {
      const result = await InvoiceService.getInvoiceById(
        new mongoose.Types.ObjectId()
      );
      expect(result).toBeNull();
    });

    test("UC0002_returnsDetailWithBasicFieldsWhenFound", async () => {
      const soId = new mongoose.Types.ObjectId();
      const insert = await Invoice.collection.insertOne({
        service_order_id: soId,
        amount: 100000,
        subtotal: 90000,
        tax: 10000,
        status: "unpaid",
      });

      const result = await InvoiceService.getInvoiceById(insert.insertedId);

      expect(result).toBeDefined();
      expect(result.id).toBe(insert.insertedId.toString());
      expect(result.totalAmount).toBe(100000);
      expect(result.subtotal).toBe(90000);
      expect(result.tax).toBe(10000);
    });

    test("UC0003_populatesServiceOrderBookingAndVehicle", async () => {
      const vehicleId = new mongoose.Types.ObjectId();
      await Vehicle.collection.insertOne({
        _id: vehicleId,
        license_plate: "30B-99999",
      });
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_test",
        vehicle_id: vehicleId,
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 150000,
        subtotal: 150000,
        tax: 0,
        status: "unpaid",
      });

      const result = await InvoiceService.getInvoiceById(insert.insertedId);

      expect(result.licensePlate).toBe("30B-99999");
      expect(result.customerClerkId).toBe("user_test");
      expect(result.serviceOrderId).toBe(soInsert.insertedId.toString());
    });

    test("UC0004_generatesInvoiceAndOrderNumbersOnFetch", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_test",
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 150000,
        subtotal: 150000,
        tax: 0,
        status: "unpaid",
      });

      const result = await InvoiceService.getInvoiceById(insert.insertedId);

      expect(result.invoiceNumber).toMatch(/^HD\d{6}$/);
      expect(result.serviceOrderNumber).toMatch(/^SC\d{6}$/);
    });
  });

  describe("getInvoiceByIdForCustomer", () => {
    const CUSTOMER_ID = "user_customer_001";
    const OTHER_CUSTOMER_ID = "user_customer_002";

    test("UC0001_returnsNullWhenInvoiceNotFound", async () => {
      const result = await InvoiceService.getInvoiceByIdForCustomer(
        new mongoose.Types.ObjectId(),
        CUSTOMER_ID
      );
      expect(result).toBeNull();
    });

    test("UC0002_returnsNullWhenInvoiceDoesNotBelongToCustomer", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: OTHER_CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 120000,
        subtotal: 120000,
        tax: 0,
        status: "unpaid",
      });

      const result = await InvoiceService.getInvoiceByIdForCustomer(
        insert.insertedId,
        CUSTOMER_ID
      );

      expect(result).toBeNull();
    });

    test("UC0003_returnsDetailWhenInvoiceBelongsToCustomer", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 220000,
        subtotal: 220000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Customer A",
      });

      const result = await InvoiceService.getInvoiceByIdForCustomer(
        insert.insertedId,
        CUSTOMER_ID
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(insert.insertedId.toString());
      expect(result.customerName).toBe("Customer A");
      expect(result.customerClerkId).toBe(CUSTOMER_ID);
    });

    test("UC0004_setsConfirmedByNameWhenConfirmedBySystem", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: CUSTOMER_ID,
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 220000,
        subtotal: 220000,
        tax: 0,
        status: "paid",
        confirmed_by: "SYSTEM",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({
        [CUSTOMER_ID]: "Customer A",
      });

      const result = await InvoiceService.getInvoiceByIdForCustomer(
        insert.insertedId,
        CUSTOMER_ID
      );

      expect(result.confirmedBy).toBe("Hệ thống");
    });
  });

  describe("confirmInvoicePayment", () => {
    const STAFF_ID = "staff_001";

    test("UC0001_throwsWhenInvoiceNotFound", async () => {
      const promise = InvoiceService.confirmInvoicePayment(
        new mongoose.Types.ObjectId(),
        "cash",
        STAFF_ID
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe(ERROR_CODES.INVOICE_NOT_FOUND);
    });

    test("UC0002_throwsWhenInvoiceAlreadyPaid", async () => {
      const insert = await Invoice.collection.insertOne({
        service_order_id: new mongoose.Types.ObjectId(),
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "paid",
      });

      const promise = InvoiceService.confirmInvoicePayment(
        insert.insertedId,
        "cash",
        STAFF_ID
      );

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe(ERROR_CODES.INVALID_STATUS_TRANSITION);
    });

    test("UC0003_updatesPaymentMethodVoucherAndPaidAmount", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_customer_001",
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 300000,
        subtotal: 300000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({});

      const result = await InvoiceService.confirmInvoicePayment(
        insert.insertedId,
        "qr_code",
        STAFF_ID,
        { voucherCode: "SALE10", paidAmount: 250000 }
      );

      expect(result.status).toBe("paid");
      expect(result.paymentMethod).toBe("qr_code");
      expect(result.discountCode).toBe("SALE10");
      expect(result.totalAmount).toBe(250000);
      expect(result.discountAmount).toBe(50000);
    });

    test("UC0004_clampsPaidAmountGreaterThanTotal", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_customer_001",
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 200000,
        subtotal: 200000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({});

      const result = await InvoiceService.confirmInvoicePayment(
        insert.insertedId,
        "cash",
        STAFF_ID,
        { paidAmount: 500000 }
      );

      expect(result.totalAmount).toBe(200000);
      expect(result.discountAmount).toBe(0);
    });

    test("UC0005_ignoresInvalidNegativePaidAmount", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_customer_001",
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 200000,
        subtotal: 200000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({});

      const result = await InvoiceService.confirmInvoicePayment(
        insert.insertedId,
        "cash",
        STAFF_ID,
        { paidAmount: -1000 }
      );

      expect(result.totalAmount).toBe(200000);
      expect(result.discountAmount).toBe(0);
    });

    test("UC0006_callsNotificationServiceWithActorId", async () => {
      const bookingInsert = await Booking.collection.insertOne({
        customer_clerk_id: "user_customer_001",
        vehicle_id: new mongoose.Types.ObjectId(),
        slot_start_time: new Date(),
        slot_end_time: new Date(),
      });
      const soInsert = await ServiceOrder.collection.insertOne({
        booking_id: bookingInsert.insertedId,
        items: [],
        staff_clerk_id: "staff_test",
      });
      const insert = await Invoice.collection.insertOne({
        service_order_id: soInsert.insertedId,
        amount: 200000,
        subtotal: 200000,
        tax: 0,
        status: "unpaid",
      });

      UsersService.getFullNamesByIds.mockResolvedValue({});

      await InvoiceService.confirmInvoicePayment(
        insert.insertedId,
        "cash",
        STAFF_ID,
        {
          paidAmount: 200000,
        }
      );

      expect(notificationService.notifyPaymentSuccess).toHaveBeenCalled();
      const callArgs = notificationService.notifyPaymentSuccess.mock.calls[0];
      expect(callArgs[1]).toEqual({ actorClerkId: STAFF_ID });
    });
  });

  describe("updateLoyaltyPoints", () => {
    test("UC0001_returnsNullWhenInvoiceIdMissing", async () => {
      const result = await InvoiceService.updateLoyaltyPoints(null, 10);
      expect(result).toBeNull();
    });

    test("UC0002_returnsNullWhenInvoiceNotFound", async () => {
      const result = await InvoiceService.updateLoyaltyPoints(
        new mongoose.Types.ObjectId(),
        10
      );
      expect(result).toBeNull();
    });

    test("UC0003_setsPositivePointsOnInvoice", async () => {
      const insert = await Invoice.collection.insertOne({
        service_order_id: new mongoose.Types.ObjectId(),
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "paid",
      });

      const result = await InvoiceService.updateLoyaltyPoints(
        insert.insertedId,
        15
      );

      expect(result).toBeDefined();
      expect(result.loyalty_points_earned).toBe(15);
    });

    test("UC0004_negativePointsAreNormalizedToZero", async () => {
      const insert = await Invoice.collection.insertOne({
        service_order_id: new mongoose.Types.ObjectId(),
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "paid",
      });

      const result = await InvoiceService.updateLoyaltyPoints(
        insert.insertedId,
        -5
      );

      expect(result.loyalty_points_earned).toBe(0);
    });

    test("UC0005_nonNumericPointsBecomeZero", async () => {
      const insert = await Invoice.collection.insertOne({
        service_order_id: new mongoose.Types.ObjectId(),
        amount: 100000,
        subtotal: 100000,
        tax: 0,
        status: "paid",
      });

      const result = await InvoiceService.updateLoyaltyPoints(
        insert.insertedId,
        "abc"
      );

      expect(result.loyalty_points_earned).toBe(0);
    });
  });
});
