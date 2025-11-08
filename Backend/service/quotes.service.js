const { Quote, ServiceOrder } = require("../model");
const DomainError = require("../errors/domainError");

const ERROR_CODES = {
  QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND",
  QUOTE_ALREADY_EXISTS: "QUOTE_ALREADY_EXISTS",
  QUOTE_INVALID_STATE_TRANSITION: "QUOTE_INVALID_STATE_TRANSITION",
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  QUOTE_ITEMS_REQUIRED: "QUOTE_ITEMS_REQUIRED",
};

class QuotesService {
  async createQuote(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
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

    const items = serviceOrder.items.map(item => ({
      type: item.item_type,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const quote = new Quote({
      so_id: serviceOrderId,
      subtotal: serviceOrder.getTotalCostBeforeTax(),
      tax: serviceOrder.getTaxAmount(),
      items: items,
      status: "pending",
    });

    await quote.save();

    serviceOrder.status = "waiting_customer_approval";
    await serviceOrder.save();

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

    return this._mapToQuoteDTO(quote);
  }

  async listQuotes(page = 1, limit = 10, serviceOrderId = null) {
    const skip = (page - 1) * limit;
    const query = serviceOrderId ? { so_id: serviceOrderId } : {};

    const [quotes, totalItems] = await Promise.all([
      Quote.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
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
      items: quote.items.map(item => ({
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
