const { Invoice, ServiceOrder } = require("../model");
const DomainError = require("../errors/domainError");
const { UsersService } = require("./users.service");

const ERROR_CODES = {
  INVOICE_NOT_FOUND: "INVOICE_NOT_FOUND",
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "INVALID_INVOICE_STATUS_TRANSITION",
};

class InvoiceService {
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

    const serviceOrder = invoice.service_order_id;
    const booking = serviceOrder?.booking_id;
    const customerClerkId = booking?.customer_clerk_id;
    const customerMap = customerClerkId
      ? await UsersService.getFullNamesByIds([customerClerkId])
      : {};

    return this._mapInvoiceDetail(
      invoice,
      serviceOrder,
      booking,
      customerMap[customerClerkId] || null
    );
  }

  async confirmInvoicePayment(invoiceId, paymentMethod, confirmedBy) {
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

    invoice.status = "paid";
    invoice.confirmed_by = confirmedBy || null;
    invoice.confirmed_at = new Date();

    await invoice.save();

    const serviceOrder = invoice.service_order_id;
    const booking = serviceOrder?.booking_id;
    const customerClerkId = booking?.customer_clerk_id;
    const customerMap = customerClerkId
      ? await UsersService.getFullNamesByIds([customerClerkId])
      : {};

    return this._mapInvoiceDetail(
      invoice,
      serviceOrder,
      booking,
      customerMap[customerClerkId] || null
    );
  }

  _mapInvoiceSummary(invoice, serviceOrder, customerName = null) {
    const booking = serviceOrder?.booking_id;
    const vehicle = booking?.vehicle_id;

    return {
      id: invoice._id.toString(),
      serviceOrderId: serviceOrder?._id?.toString() || null,
      status: invoice.status,
      totalAmount: invoice.amount,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      createdAt: invoice.createdAt,
      customerName,
      licensePlate: vehicle?.license_plate || null,
    };
  }

  _mapInvoiceDetail(invoice, serviceOrder, booking, customerName = null) {
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
      serviceOrderId: serviceOrder?._id?.toString() || null,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      totalAmount: invoice.amount,
      paymentMethod: invoice.payment_method || null,
      confirmedBy: invoice.confirmed_by || null,
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
