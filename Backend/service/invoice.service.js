const { Invoice, ServiceOrder } = require("../model");
const DomainError = require("../errors/domainError");
const { UsersService } = require("./users.service");

const ERROR_CODES = {
  INVOICE_NOT_FOUND: "INVOICE_NOT_FOUND",
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "INVALID_INVOICE_STATUS_TRANSITION",
};

class InvoiceService {
  async _ensureInvoiceNumber(invoice) {
    if (!invoice.invoiceNumber) {
      const lastInvoice = await Invoice.findOne({
        invoiceNumber: new RegExp("^HD"),
      })
        .sort({ invoiceNumber: -1 })
        .exec();

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.slice(2));
        nextNumber = lastNumber + 1;
      }

      invoice.invoiceNumber = `HD${String(nextNumber).padStart(6, "0")}`;
      await invoice.save();
    }
    return invoice.invoiceNumber;
  }

  async _ensureOrderNumber(serviceOrder) {
    if (serviceOrder && !serviceOrder.orderNumber) {
      const lastOrder = await ServiceOrder.findOne({
        orderNumber: new RegExp("^SC"),
      })
        .sort({ orderNumber: -1 })
        .exec();

      let nextNumber = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber.slice(2));
        nextNumber = lastNumber + 1;
      }

      serviceOrder.orderNumber = `SC${String(nextNumber).padStart(6, "0")}`;
      await serviceOrder.save();
    }
    return serviceOrder?.orderNumber;
  }

  async ensureInvoiceForServiceOrder(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate({
        path: "items.part_id",
      })
      .exec();

    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh sửa chữa không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    const subtotal = serviceOrder.getTotalCostBeforeTax();
    const tax = serviceOrder.getTaxAmount();
    const total = serviceOrder.getAmountAfterTax();

    let invoice = await Invoice.findOne({
      service_order_id: serviceOrderId,
    }).exec();
    if (!invoice) {
      invoice = new Invoice({
        service_order_id: serviceOrderId,
        subtotal,
        tax,
        amount: total,
        status: "unpaid",
      });
    } else {
      invoice.subtotal = subtotal;
      invoice.tax = tax;
      invoice.amount = total;
    }

    try {
      await invoice.save();
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.quote_id === 1) {
        try {
          await Invoice.collection.dropIndex("quote_id_1");
        } catch (dropError) {
          if (dropError?.codeName !== "IndexNotFound") {
            throw dropError;
          }
        }

        await Invoice.collection.createIndex(
          { quote_id: 1 },
          {
            unique: true,
            partialFilterExpression: { quote_id: { $type: "objectId" } },
          }
        );

        await invoice.save();
      } else {
        throw error;
      }
    }
    return this._mapInvoiceSummary(invoice, serviceOrder);
  }

  async listInvoicesForCustomer(customerClerkId) {
    const invoices = await Invoice.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "service_order_id",
        populate: [
          { path: "booking_id", populate: { path: "vehicle_id" } },
          { path: "items.part_id" },
        ],
      })
      .exec();

    const customerInvoices = invoices.filter((invoice) => {
      const booking = invoice.service_order_id?.booking_id;
      return booking?.customer_clerk_id === customerClerkId;
    });

    if (customerInvoices.length === 0) {
      return [];
    }

    const customerMap = await UsersService.getFullNamesByIds([customerClerkId]);

    // Đảm bảo tất cả invoice và serviceOrder đều có số format
    for (const invoice of customerInvoices) {
      await this._ensureInvoiceNumber(invoice);
      if (invoice.service_order_id) {
        await this._ensureOrderNumber(invoice.service_order_id);
      }
    }

    return customerInvoices.map((invoice) =>
      this._mapInvoiceSummary(
        invoice,
        invoice.service_order_id,
        customerMap[customerClerkId] || null
      )
    );
  }

  async getInvoiceByIdForCustomer(invoiceId, customerClerkId) {
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "service_order_id",
        populate: [
          { path: "booking_id", populate: { path: "vehicle_id" } },
          { path: "items.part_id" },
        ],
      })
      .exec();

    if (!invoice) {
      return null;
    }

    const booking = invoice.service_order_id?.booking_id;
    if (booking?.customer_clerk_id !== customerClerkId) {
      return null;
    }

    // Đảm bảo invoice và serviceOrder đều có số format
    await this._ensureInvoiceNumber(invoice);
    if (invoice.service_order_id) {
      await this._ensureOrderNumber(invoice.service_order_id);
    }

    // Xử lý confirmed_by: nếu là "SYSTEM" thì trả về "Hệ thống"
    let confirmedByName = null;
    if (invoice.confirmed_by === "SYSTEM") {
      confirmedByName = "Hệ thống";
    } else if (invoice.confirmed_by) {
      const userIds = [invoice.confirmed_by];
      const userMap = await UsersService.getFullNamesByIds(userIds);
      confirmedByName = userMap[invoice.confirmed_by] || null;
    }

    const userIds = [customerClerkId];
    const userMap = await UsersService.getFullNamesByIds(userIds);

    return this._mapInvoiceDetail(
      invoice,
      invoice.service_order_id,
      booking,
      userMap[customerClerkId] || null,
      confirmedByName
    );
  }

  async listInvoices({ page = 1, limit = 10, status = null } = {}) {
    const filters = {};
    if (status) {
      filters.status = status;
    }

    const skip = (page - 1) * limit;

    const [invoices, totalItems] = await Promise.all([
      Invoice.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "service_order_id",
          populate: {
            path: "booking_id",
            populate: { path: "vehicle_id" },
          },
        })
        .exec(),
      Invoice.countDocuments(filters).exec(),
    ]);

    const serviceOrders = invoices
      .map((inv) => inv.service_order_id)
      .filter(Boolean);

    const customerClerkIds = serviceOrders
      .map((so) => so?.booking_id?.customer_clerk_id)
      .filter(Boolean);

    const customerMap = await UsersService.getFullNamesByIds(customerClerkIds);

    // Đảm bảo tất cả invoice và serviceOrder đều có số format
    await Promise.all(
      invoices.map(async (invoice) => {
        await this._ensureInvoiceNumber(invoice);
        if (invoice.service_order_id) {
          await this._ensureOrderNumber(invoice.service_order_id);
        }
      })
    );

    const data = invoices.map((invoice) => {
      const serviceOrder = invoice.service_order_id;
      return this._mapInvoiceSummary(
        invoice,
        serviceOrder,
        customerMap[serviceOrder?.booking_id?.customer_clerk_id] || null
      );
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      invoices: data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "service_order_id",
        populate: [
          { path: "booking_id", populate: { path: "vehicle_id" } },
          { path: "items.part_id" },
        ],
      })
      .exec();

    if (!invoice) {
      return null;
    }

    // Đảm bảo invoice và serviceOrder đều có số format
    await this._ensureInvoiceNumber(invoice);
    if (invoice.service_order_id) {
      await this._ensureOrderNumber(invoice.service_order_id);
    }

    const serviceOrder = invoice.service_order_id;
    const booking = serviceOrder?.booking_id;
    const customerClerkId = booking?.customer_clerk_id;

    // Xử lý confirmed_by: nếu là "SYSTEM" thì trả về "Hệ thống"
    let confirmedByName = null;
    if (invoice.confirmed_by === "SYSTEM") {
      confirmedByName = "Hệ thống";
    } else if (invoice.confirmed_by) {
      const userIds = [invoice.confirmed_by];
      const userMap = await UsersService.getFullNamesByIds(userIds);
      confirmedByName = userMap[invoice.confirmed_by] || null;
    }

    const userIds = [];
    if (customerClerkId) userIds.push(customerClerkId);

    const userMap =
      userIds.length > 0 ? await UsersService.getFullNamesByIds(userIds) : {};

    return this._mapInvoiceDetail(
      invoice,
      serviceOrder,
      booking,
      userMap[customerClerkId] || null,
      confirmedByName
    );
  }

  async confirmInvoicePayment(
    invoiceId,
    paymentMethod,
    confirmedBy,
    { voucherCode, paidAmount } = {}
  ) {
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "service_order_id",
        populate: {
          path: "booking_id",
          populate: { path: "vehicle_id" },
        },
      })
      .exec();

    if (!invoice) {
      throw new DomainError(
        "Hóa đơn không tồn tại",
        ERROR_CODES.INVOICE_NOT_FOUND,
        404
      );
    }

    if (invoice.status === "paid") {
      throw new DomainError(
        "Hóa đơn đã được thanh toán",
        ERROR_CODES.INVALID_STATUS_TRANSITION,
        400
      );
    }

    if (paymentMethod) {
      invoice.payment_method = paymentMethod;
    }

    if (voucherCode) {
      invoice.discount_code = voucherCode;
    }

    if (paidAmount !== undefined && paidAmount !== null) {
      const numericPaid = Number(paidAmount);
      if (!Number.isNaN(numericPaid) && numericPaid >= 0) {
        const originalAmount = Number(invoice.amount) || 0;
        const effectivePaid = Math.min(numericPaid, originalAmount);
        invoice.paid_amount = effectivePaid;
        invoice.discount_amount = Math.max(originalAmount - effectivePaid, 0);
      }
    }

    invoice.status = "paid";
    invoice.confirmed_by = confirmedBy || null;
    invoice.confirmed_at = new Date();

    await invoice.save();

    // Đảm bảo invoice và serviceOrder đều có số format
    await this._ensureInvoiceNumber(invoice);
    if (invoice.service_order_id) {
      await this._ensureOrderNumber(invoice.service_order_id);
    }

    const serviceOrder = invoice.service_order_id;
    const booking = serviceOrder?.booking_id;
    const customerClerkId = booking?.customer_clerk_id;

    // Xử lý confirmed_by: nếu là "SYSTEM" thì trả về "Hệ thống"
    let confirmedByName = null;
    if (invoice.confirmed_by === "SYSTEM") {
      confirmedByName = "Hệ thống";
    } else if (invoice.confirmed_by) {
      const userIds = [invoice.confirmed_by];
      const userMap = await UsersService.getFullNamesByIds(userIds);
      confirmedByName = userMap[invoice.confirmed_by] || null;
    }

    const userIds = [];
    if (customerClerkId) userIds.push(customerClerkId);

    const userMap =
      userIds.length > 0 ? await UsersService.getFullNamesByIds(userIds) : {};

    return this._mapInvoiceDetail(
      invoice,
      serviceOrder,
      booking,
      userMap[customerClerkId] || null,
      confirmedByName
    );
  }

  async updateLoyaltyPoints(invoiceId, pointsEarned) {
    if (!invoiceId) return null;
    const normalizedPoints = Math.max(Number(pointsEarned) || 0, 0);
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return null;
    }

    invoice.loyalty_points_earned = normalizedPoints;
    await invoice.save();
    return invoice;
  }

  _mapInvoiceSummary(invoice, serviceOrder, customerName = null) {
    const booking = serviceOrder?.booking_id;
    const vehicle = booking?.vehicle_id;

    return {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber || invoice._id.toString(),
      serviceOrderId: serviceOrder?._id?.toString() || null,
      serviceOrderNumber:
        serviceOrder?.orderNumber || serviceOrder?._id?.toString() || null,
      status: invoice.status,
      totalAmount: invoice.paid_amount ?? invoice.amount,
      originalAmount: invoice.amount,
      discountCode: invoice.discount_code || null,
      discountAmount: invoice.discount_amount || 0,
      loyaltyPointsEarned: invoice.loyalty_points_earned || 0,
      clerkId: invoice.clerkId || null,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      createdAt: invoice.createdAt,
      customerName,
      licensePlate: vehicle?.license_plate || null,
    };
  }

  _mapInvoiceDetail(
    invoice,
    serviceOrder,
    booking,
    customerName = null,
    confirmedByName = null
  ) {
    const vehicle = booking?.vehicle_id;

    const items = (serviceOrder?.items || []).map((item) => ({
      type: item.item_type,
      name:
        item.item_type === "part" ? item.part_id?.name || item.name : item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
    }));

    return {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber || invoice._id.toString(),
      serviceOrderId: serviceOrder?._id?.toString() || null,
      serviceOrderNumber:
        serviceOrder?.orderNumber || serviceOrder?._id?.toString() || null,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      totalAmount: invoice.paid_amount ?? invoice.amount,
      originalAmount: invoice.amount,
      discountCode: invoice.discount_code || null,
      discountAmount: invoice.discount_amount || 0,
      loyaltyPointsEarned: invoice.loyalty_points_earned || 0,
      clerkId: invoice.clerkId || null,
      paymentMethod: invoice.payment_method || null,
      confirmedBy: confirmedByName || invoice.confirmed_by || null,
      confirmedAt: invoice.confirmed_at || null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      customerName,
      customerClerkId: booking?.customer_clerk_id || null,
      licensePlate: vehicle?.license_plate || null,
      vehicleId: vehicle?._id?.toString() || null,
      items,
    };
  }
}

module.exports = { InvoiceService: new InvoiceService(), ERROR_CODES };
