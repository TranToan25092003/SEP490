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
  /**
   * Create a quote from a service order
   * @param {string} serviceOrderId - ID of the service order
   * @returns {Promise<import("./types").QuoteDTO>}
   * @throws {DomainError} If service order not found or quote already exists
   * @example
   * const quote = await quotesService.createQuote("507f1f77bcf86cd799439011");
   */
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

    return this._mapToQuoteDTO(quote);
  }

  /**
   * Approve a quote
   * @param {string} quoteId - ID of the quote to approve
   * @returns {Promise<import("./types").QuoteDTO>}
   * @throws {DomainError} If quote not found or invalid state transition
   * @example
   * const approvedQuote = await quotesService.approveQuote("507f1f77bcf86cd799439011");
   */
  async approveQuote(quoteId) {
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
        "Chỉ có thể phê duyệt báo giá ở trạng thái 'pending'",
        ERROR_CODES.QUOTE_INVALID_STATE_TRANSITION,
        400
      );
    }

    quote.status = "approved";
    await quote.save();

    return this._mapToQuoteDTO(quote);
  }

  /**
   * Reject a quote with a reason
   * @param {string} quoteId - ID of the quote to reject
   * @param {string} reason - Reason for rejection
   * @returns {Promise<import("./types").QuoteDTO>}
   * @throws {DomainError} If quote not found or invalid state transition
   * @example
   * const rejectedQuote = await quotesService.rejectQuote(
   *   "507f1f77bcf86cd799439011",
   *   "Giá quá cao"
   * );
   */
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

  /**
   * List quotes with pagination
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Number of items per page
   * @param {string} [serviceOrderId] - Optional service order ID to filter by
   * @returns {Promise<{quotes: Array<import("./types").QuoteSummaryDTO>, pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number}}>}
   * @example
   * const result = await quotesService.listQuotes(1, 10);
   * console.log(result.quotes);
   * console.log(result.pagination);
   */
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

  /**
   * Get quote by ID
   * @param {string} quoteId - ID of the quote
   * @returns {Promise<import("./types").QuoteDTO | null>}
   * @example
   * const quote = await quotesService.getQuoteById("507f1f77bcf86cd799439011");
   */
  async getQuoteById(quoteId) {
    const quote = await Quote.findById(quoteId).exec();
    if (!quote) {
      return null;
    }
    return this._mapToQuoteDTO(quote);
  }

  /**
   * Map quote model to QuoteDTO
   * @private
   * @param {Quote} quote
   * @returns {import("./types").QuoteDTO}
   */
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

  /**
   * Map quote model to QuoteSummaryDTO
   * @private
   * @param {Quote} quote
   * @returns {import("./types").QuoteSummaryDTO}
   */
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
