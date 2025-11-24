const { Quote, ServiceOrder } = require("../model");
const DomainError = require("../errors/domainError");
const notificationService = require("./notification.service");

const ERROR_CODES = {
  QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND",
  QUOTE_ALREADY_EXISTS: "QUOTE_ALREADY_EXISTS",
  QUOTE_INVALID_STATE_TRANSITION: "QUOTE_INVALID_STATE_TRANSITION",
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  QUOTE_ITEMS_REQUIRED: "QUOTE_ITEMS_REQUIRED",
};

class QuotesService {
  async createQuote(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate("items.part_id")
      .populate("booking_id")
      .exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh sửa chữa không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (!serviceOrder.items || serviceOrder.items.length === 0) {
      throw new DomainError(
        "Lệnh sửa chữa phải có ít nhất một mục để tạo báo giá",
        ERROR_CODES.QUOTE_ITEMS_REQUIRED,
        400
      );
    }

    // Tạo items từ service order
    const items = serviceOrder.items.map((item) => ({
      type: item.item_type,
      name: item.item_type === "service" ? item.name : item.part_id.name,
      quantity: item.quantity,
      price: item.price,
    }));

    // Tìm warranty liên quan đến booking này (nếu đây là warranty booking)
    let warranty = null;
    if (serviceOrder.booking_id?._id) {
      const Warranty = require("../model/warranty.model");
      warranty = await Warranty.findOne({
        booking_id: serviceOrder.booking_id._id,
      })
        .populate("warranty_parts.part_id")
        .exec();
    }

    // Nếu có warranty, thêm warranty parts vào items với giá = 0
    if (
      warranty &&
      warranty.warranty_parts &&
      warranty.warranty_parts.length > 0
    ) {
      warranty.warranty_parts.forEach((wp) => {
        // Kiểm tra xem part này đã có trong items chưa
        const existingPartIndex = items.findIndex(
          (item) =>
            item.type === "part" &&
            item.name === (wp.part_name || wp.part_id?.name)
        );

        if (existingPartIndex >= 0) {
          // Nếu đã có, đảm bảo giá = 0
          items[existingPartIndex].price = 0;
        } else {
          // Nếu chưa có, thêm mới với giá = 0
          items.push({
            type: "part",
            name: wp.part_name || wp.part_id?.name,
            quantity: wp.quantity || 1,
            price: 0, // Giá bảo hành = 0
          });
        }
      });
    }

    // Tính toán tổng tiền (bao gồm cả warranty parts với giá = 0)
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;

    const existingQuoteCount = await Quote.countDocuments({
      so_id: serviceOrderId,
    });

    const quote = new Quote({
      so_id: serviceOrderId,
      subtotal: subtotal,
      tax: tax,
      items: items,
      status: "pending",
    });

    await quote.save();

    serviceOrder.status = "waiting_customer_approval";
    serviceOrder.waiting_approval_at = new Date(); // Lưu thời gian chuyển sang waiting_customer_approval
    await serviceOrder.save();

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });
    await notificationService.notifyCustomerNewQuote(serviceOrder, quote, {
      isRevision: existingQuoteCount > 0,
    });

    return this._mapToQuoteDTO(quote);
  }

  async approveQuote(quoteId) {
    const quote = await Quote.findById(quoteId).exec();
    if (!quote) {
      throw new DomainError(
        "Báo giá không tồn tại",
        ERROR_CODES.QUOTE_NOT_FOUND,
        404
      );
    }

    const serviceOrder = await ServiceOrder.findById(quote.so_id).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh sửa chữa liên quan không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (quote.status !== "pending") {
      throw new DomainError(
        "Chỉ có thể phê duyệt báo giá ở trạng thái 'pending'",
        ERROR_CODES.QUOTE_INVALID_STATE_TRANSITION,
        400
      );
    }

    quote.status = "approved";
    await quote.save();

    serviceOrder.status = "approved";
    await serviceOrder.save();

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });
    await notificationService.notifyQuoteApproved(serviceOrder, quote);

    return this._mapToQuoteDTO(quote);
  }

  async rejectQuote(quoteId, reason) {
    const quote = await Quote.findById(quoteId).exec();
    if (!quote) {
      throw new DomainError(
        "Báo giá không tồn tại",
        ERROR_CODES.QUOTE_NOT_FOUND,
        404
      );
    }

    if (quote.status !== "pending") {
      throw new DomainError(
        "Chỉ có thể từ chối báo giá ở trạng thái 'pending'",
        ERROR_CODES.QUOTE_INVALID_STATE_TRANSITION,
        400
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new DomainError(
        "Lý do từ chối là bắt buộc",
        ERROR_CODES.QUOTE_ITEMS_REQUIRED,
        400
      );
    }

    quote.status = "rejected";
    quote.rejected_reason = reason;
    await quote.save();

    const serviceOrder = await ServiceOrder.findById(quote.so_id).exec();
    if (serviceOrder) {
      await notificationService.notifyQuoteRevisionRequested(
        serviceOrder,
        quote
      );
    }

    return this._mapToQuoteDTO(quote);
  }

  async listQuotes(page = 1, limit = 10, serviceOrderId = null) {
    const skip = (page - 1) * limit;
    const query = serviceOrderId ? { so_id: serviceOrderId } : {};

    const [quotes, totalItems] = await Promise.all([
      Quote.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Quote.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      quotes: quotes.map(this._mapToQuoteSummaryDTO),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  async getQuoteById(quoteId) {
    const quote = await Quote.findById(quoteId).exec();
    if (!quote) {
      return null;
    }
    return this._mapToQuoteDTO(quote);
  }

  _mapToQuoteDTO(quote) {
    return {
      id: quote._id.toString(),
      serviceOrderId: quote.so_id.toString(),
      items: quote.items.map((item) => ({
        type: item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: quote.subtotal,
      tax: quote.tax,
      grandTotal: quote.subtotal + quote.tax,
      status: quote.status,
      rejectedReason: quote.rejected_reason,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }

  _mapToQuoteSummaryDTO(quote) {
    return {
      id: quote._id.toString(),
      serviceOrderId: quote.so_id.toString(),
      grandTotal: quote.subtotal + quote.tax,
      status: quote.status,
      createdAt: quote.createdAt,
    };
  }
}

module.exports = { QuotesService: new QuotesService(), ERROR_CODES };
