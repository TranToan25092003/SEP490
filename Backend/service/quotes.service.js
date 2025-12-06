const { Quote, ServiceOrder, Part } = require("../model");
const DomainError = require("../errors/domainError");
const notificationService = require("./notification.service");

const ERROR_CODES = {
  QUOTE_NOT_FOUND: "QUOTE_NOT_FOUND",
  QUOTE_ALREADY_EXISTS: "QUOTE_ALREADY_EXISTS",
  QUOTE_INVALID_STATE_TRANSITION: "QUOTE_INVALID_STATE_TRANSITION",
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  QUOTE_ITEMS_REQUIRED: "QUOTE_ITEMS_REQUIRED",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
};

function mapToQuoteDTO(quote) {
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

function mapToQuoteSummaryDTO(quote) {
  return {
    id: quote._id.toString(),
    serviceOrderId: quote.so_id.toString(),
    grandTotal: quote.subtotal + quote.tax,
    status: quote.status,
    rejectedReason: quote.rejected_reason || null,
    createdAt: quote.createdAt,
  };
}

class QuotesService {
  async createQuote(serviceOrderId) {
    try {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
        .populate({
          path: "items.part_id",
          model: "Part",
        })
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

    // Kiểm tra trạng thái service order - chỉ cho phép tạo quote khi ở trạng thái phù hợp
    if (
      serviceOrder.status !== "inspection_completed" &&
      serviceOrder.status !== "waiting_customer_approval"
    ) {
      throw new DomainError(
        `Không thể tạo báo giá khi lệnh sửa chữa ở trạng thái '${serviceOrder.status}'. Chỉ có thể tạo báo giá khi đã hoàn thành kiểm tra hoặc đang chờ phê duyệt.`,
        ERROR_CODES.SERVICE_ORDER_INVALID_STATE,
        400
      );
    }

    // Tạo items từ service order
    const items = [];
    for (const item of serviceOrder.items) {
      try {
        let itemName = item.name || "N/A";
        let itemPrice = item.price || 0;
        let itemQuantity = item.quantity || 1;

        if (item.item_type === "part") {
          // Nếu part_id chưa được populate, thử populate lại
          if (!item.part_id || typeof item.part_id === "string") {
            const Part = require("../model/part.model");
            const partId = item.part_id?._id || item.part_id;
            if (partId) {
              const part = await Part.findById(partId).exec();
              if (part) {
                item.part_id = part;
                itemName = part.name;
              } else {
                console.warn(`Part với ID ${partId} không tồn tại`);
                itemName = item.name || `Part ID: ${partId}`;
              }
            } else {
              itemName = item.name || "N/A";
            }
          } else {
            // part_id đã được populate
            itemName = item.part_id.name || item.name || "N/A";
          }
        }

        items.push({
      type: item.item_type,
          name: itemName,
          quantity: itemQuantity,
          price: itemPrice,
        });
      } catch (error) {
        console.error(`Lỗi khi xử lý item:`, error);
        throw new DomainError(
          `Lỗi khi xử lý mục trong lệnh sửa chữa: ${error.message}`,
          ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
          400
        );
      }
    }

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
    if (warranty?.warranty_parts && warranty.warranty_parts.length > 0) {
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

    // Kiểm tra tồn kho trước khi tạo báo giá
    // Yêu cầu:
    // - Trường hợp 1: nếu tồn kho thực tế = 0 thì không cho gửi báo giá
    // - Trường hợp 2: nếu còn rất ít hàng nhưng đã được “giữ chỗ” bởi các quote PENDING khác,
    //   thì đơn mới không được gửi, kèm thông tin đơn đang giữ chỗ.

    // 1) Gom nhu cầu part cho CHÍNH quote hiện tại (service order + warranty)
    const partRequirements = new Map(); // partId -> requiredQty
    const partMeta = new Map(); // partId -> { name, stock }

    // Từ service order items
    serviceOrder.items.forEach((item) => {
      if (item.item_type === "part" && item.part_id) {
        const partId = item.part_id._id?.toString();
        if (!partId) return;

        const requiredQty = item.quantity || 0;
        const currentRequired = partRequirements.get(partId) || 0;
        partRequirements.set(partId, currentRequired + requiredQty);

        if (!partMeta.has(partId)) {
          partMeta.set(partId, {
            name: item.part_id.name,
            stock:
              typeof item.part_id.quantity === "number"
                ? item.part_id.quantity
                : 0,
          });
        }
      }
    });

    // Từ warranty parts (kể cả bảo hành cũng cần tồn kho)
    if (warranty?.warranty_parts && warranty.warranty_parts.length > 0) {
      warranty.warranty_parts.forEach((wp) => {
        if (wp.part_id) {
          const partId = wp.part_id._id?.toString();
          if (!partId) return;

          const requiredQty = wp.quantity || 1;
          const currentRequired = partRequirements.get(partId) || 0;
          partRequirements.set(partId, currentRequired + requiredQty);

          if (!partMeta.has(partId)) {
            partMeta.set(partId, {
              name: wp.part_name || wp.part_id.name,
              stock:
                typeof wp.part_id.quantity === "number"
                  ? wp.part_id.quantity
                  : 0,
            });
          }
        }
      });
    }

    // Nếu quote này không dùng part nào thì bỏ qua kiểm tra tồn kho
    if (partRequirements.size > 0) {
      // 2) Lấy tất cả quote PENDING khác đang “giữ chỗ” cùng các part này
      const pendingQuotes = await Quote.find({
        status: "pending",
        so_id: { $ne: serviceOrderId },
      })
        .populate("so_id", "orderNumber")
        .exec();

      // Map theo tên part: name -> { totalReserved, orders: Set<orderNumber> }
      const reservedByName = new Map();
      pendingQuotes.forEach((q) => {
        q.items.forEach((qi) => {
          if (qi.type === "part" && qi.name) {
            const name = qi.name;
            let entry = reservedByName.get(name);
            if (!entry) {
              entry = { totalReserved: 0, orders: new Set() };
              reservedByName.set(name, entry);
            }
            entry.totalReserved += qi.quantity || 0;
            const orderNumber =
              q.so_id?.orderNumber ||
              q.so_id?._id?.toString() ||
              "Đơn không xác định";
            entry.orders.add(orderNumber);
          }
        });
      });

      // 3) Kiểm tra cho từng part:
      // available = stock (tồn kho thực tế) - tổng quantity đang được giữ chỗ bởi các quote pending khác
      const outOfStockParts = [];

      for (const [partId, requiredQty] of partRequirements.entries()) {
        const meta = partMeta.get(partId) || {};
        const partName = meta.name || partId;
        const stockQty = typeof meta.stock === "number" ? meta.stock : 0;

        // Nếu tồn kho thực tế đã = 0 thì fail luôn (trường hợp 1)
        // hoặc nếu sau khi trừ lượng đã “giữ chỗ” mà không đủ cho quote hiện tại thì cũng fail (trường hợp 2)
        const reservedInfo = reservedByName.get(partName);
        const reservedTotal = reservedInfo?.totalReserved || 0;
        const available = stockQty - reservedTotal;

        if (stockQty <= 0 || available < requiredQty) {
          outOfStockParts.push({
            partId,
            partName,
            available,
            required: requiredQty,
            reservedBy: reservedInfo ? Array.from(reservedInfo.orders) : [],
          });
        }
      }

      if (outOfStockParts.length > 0) {
        const messages = outOfStockParts.map((p) => {
          const base = `${p.partName || p.partId}: tồn kho = ${
            typeof p.available === "number" ? p.available : 0
          }, cần ${p.required}`;
          if (p.reservedBy && p.reservedBy.length > 0) {
            return `${base} (đang được giữ chỗ cho đơn: ${p.reservedBy.join(
              ", "
            )})`;
          }
          return base;
        });

        throw new DomainError(
          `Không thể tạo báo giá vì một số phụ tùng không đủ tồn kho: ${messages.join(
            "; "
          )}`,
          ERROR_CODES.INSUFFICIENT_STOCK,
          400
        );
      }
    }

    // Chỉ tạo quote SAU KHI đã kiểm tra tồn kho thành công
    // Tính toán tổng tiền (bao gồm cả warranty parts với giá = 0)
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1;

    // Kiểm tra xem đã có quote pending chưa - chỉ cho phép 1 quote pending tại một thời điểm
    const existingPendingQuote = await Quote.findOne({
      so_id: serviceOrderId,
      status: "pending",
    }).exec();

    if (existingPendingQuote) {
      throw new DomainError(
        "Đã có báo giá đang chờ phê duyệt cho lệnh sửa chữa này. Vui lòng đợi khách hàng phê duyệt hoặc từ chối báo giá hiện tại.",
        ERROR_CODES.QUOTE_ALREADY_EXISTS,
        409
      );
    }

    // Kiểm tra xem có quote approved không - nếu có thì không cho tạo quote mới
    const existingApprovedQuote = await Quote.findOne({
      so_id: serviceOrderId,
      status: "approved",
    }).exec();

    if (existingApprovedQuote) {
      throw new DomainError(
        "Không thể tạo báo giá mới khi đã có báo giá được phê duyệt. Vui lòng tạo lệnh sửa chữa mới.",
        ERROR_CODES.QUOTE_ALREADY_EXISTS,
        409
      );
    }

    // Đếm số lượng quote hiện có (bao gồm cả rejected) để xác định có phải revision không
    const existingQuoteCount = await Quote.countDocuments({
      so_id: serviceOrderId,
    }).exec();

    // Nếu có unique index trên so_id, cần xóa các quote rejected cũ trước khi tạo quote mới
    // để tránh lỗi duplicate key. Vẫn giữ lại để hiển thị trong list (nếu không có unique index)
    // nhưng nếu có unique index thì phải xóa để tạo quote mới
    const rejectedQuotes = await Quote.find({
      so_id: serviceOrderId,
      status: "rejected",
    }).exec();

    // Xóa rejected quotes cũ trước khi tạo quote mới (để tránh duplicate key error)
    // Lưu ý: Nếu muốn giữ lại lịch sử, có thể lưu vào collection khác hoặc archive
    if (rejectedQuotes.length > 0) {
      await Quote.deleteMany({
        _id: { $in: rejectedQuotes.map((q) => q._id) },
      }).exec();
    }

    const quote = new Quote({
      so_id: serviceOrderId,
      subtotal: subtotal,
      tax: tax,
      items: items,
      status: "pending",
    });

    try {
    await quote.save();
    } catch (saveError) {
      // Xử lý lỗi duplicate key (E11000) - có thể do unique index trên so_id
      if (saveError.code === 11000 || saveError.name === "MongoServerError") {
        // Kiểm tra lại xem có quote pending không (có thể do race condition)
        const existingPending = await Quote.findOne({
          so_id: serviceOrderId,
          status: "pending",
        }).exec();

        if (existingPending) {
          throw new DomainError(
            "Đã có báo giá đang chờ phê duyệt cho lệnh sửa chữa này. Vui lòng đợi khách hàng phê duyệt hoặc từ chối báo giá hiện tại.",
            ERROR_CODES.QUOTE_ALREADY_EXISTS,
            409
          );
        } else {
          // Nếu vẫn bị lỗi duplicate key sau khi đã xóa rejected quotes,
          // có thể do unique index hoặc race condition
          // Thử xóa tất cả quotes (trừ approved) và tạo lại
          await Quote.deleteMany({
            so_id: serviceOrderId,
            status: { $ne: "approved" },
          }).exec();
          
          // Thử save lại
          try {
            await quote.save();
          } catch (retryError) {
            throw new DomainError(
              `Không thể tạo báo giá do lỗi duplicate key. Vui lòng thử lại sau.`,
              ERROR_CODES.QUOTE_ALREADY_EXISTS,
              409
            );
          }
        }
      } else {
        throw saveError;
      }
    }

    // Cập nhật service order status - chỉ cập nhật nếu chưa ở trạng thái waiting_customer_approval
    // (cho phép tạo quote mới sau khi quote cũ bị rejected)
    if (serviceOrder.status !== "waiting_customer_approval") {
    serviceOrder.status = "waiting_customer_approval";
    }
    serviceOrder.waiting_approval_at = new Date(); // Cập nhật thời gian chờ phê duyệt
    await serviceOrder.save();

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });
    await notificationService.notifyCustomerNewQuote(serviceOrder, quote, {
      isRevision: existingQuoteCount > 0,
    });

    return mapToQuoteDTO(quote);
    } catch (error) {
      // Log lỗi chi tiết để debug
      console.error("[QuotesService] Error creating quote:", {
        serviceOrderId,
        error: error.message,
        stack: error.stack,
      });
      
      // Nếu đã là DomainError thì throw lại
      if (error instanceof DomainError) {
        throw error;
      }
      
      // Nếu là lỗi khác, wrap thành DomainError
      throw new DomainError(
        `Lỗi khi tạo báo giá: ${error.message}`,
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        500
      );
    }
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

    const serviceOrder = await ServiceOrder.findById(quote.so_id)
      .populate("items.part_id")
      .populate("booking_id")
      .exec();
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

    // Tìm warranty và lấy warranty parts (kể cả bảo hành cũng cần trừ)
    let warranty = null;
    if (serviceOrder.booking_id?._id) {
      const Warranty = require("../model/warranty.model");
      warranty = await Warranty.findOne({
        booking_id: serviceOrder.booking_id._id,
      })
        .populate("warranty_parts.part_id")
        .exec();
    }

    // Tạo map để tổng hợp quantity theo part_id từ quote.items
    // Quote.items là source of truth về quantity cần trừ
    const partQuantityMap = new Map();

    // Duyệt qua tất cả quote.items để lấy quantity cần trừ
    for (const quoteItem of quote.items) {
      if (quoteItem.type === "part") {
        let partId = null;

        // Tìm part_id từ serviceOrder.items (match theo name)
        const soItem = serviceOrder.items.find(
          (soi) =>
            soi.item_type === "part" &&
            soi.part_id &&
            (soi.part_id.name === quoteItem.name || soi.name === quoteItem.name)
        );
        if (soItem && soItem.part_id) {
          partId = soItem.part_id._id.toString();
        }

        // Nếu không tìm thấy trong serviceOrder, tìm trong warranty
        if (!partId && warranty?.warranty_parts) {
          const wp = warranty.warranty_parts.find(
            (wp) =>
              wp.part_id &&
              (wp.part_name === quoteItem.name ||
                wp.part_id.name === quoteItem.name)
          );
          if (wp && wp.part_id) {
            partId = wp.part_id._id.toString();
          }
        }

        // Nếu vẫn không tìm thấy, tìm Part trực tiếp bằng name
        if (!partId) {
          const part = await Part.findOne({ name: quoteItem.name }).exec();
          if (part) {
            partId = part._id.toString();
          }
        }

        // Nếu tìm thấy partId, cộng dồn quantity vào map
        if (partId) {
          const currentQuantity = partQuantityMap.get(partId) || 0;
          partQuantityMap.set(partId, currentQuantity + quoteItem.quantity);
        }
      }
    }

    // Trường hợp 2 + tránh race condition:
    // - Dùng findOneAndUpdate với điều kiện quantity >= cần trừ (atomic)
    // - Nếu bất kỳ part nào không đủ hàng, rollback các part đã trừ và báo lỗi
    const updatedParts = [];
    const insufficientStockParts = [];

    for (const [partId, quantity] of partQuantityMap.entries()) {
      try {
        const updatedPart = await Part.findOneAndUpdate(
          {
            _id: partId,
            quantity: { $gte: quantity }, // Chỉ update nếu còn đủ hàng
          },
          { $inc: { quantity: -quantity } },
          { new: true }
        ).exec();

        if (!updatedPart) {
          // Không update được: hoặc không tìm thấy, hoặc không đủ hàng (do race)
          const currentPart = await Part.findById(partId).exec();
          insufficientStockParts.push({
            partId,
            partName: currentPart?.name || partId,
            required: quantity,
            available:
              typeof currentPart?.quantity === "number"
                ? currentPart.quantity
                : 0,
          });
        } else {
          updatedParts.push({
            partId,
            quantity,
            partName: updatedPart.name,
          });
        }
      } catch (error) {
        console.error(
          `Lỗi khi trừ quantity cho part ${partId}:`,
          error.message
        );
        throw new DomainError(
          `Lỗi khi cập nhật tồn kho: ${error.message}`,
          ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
          500
        );
      }
    }

    // Nếu có part không đủ hàng, rollback các part đã trừ và báo lỗi
    if (insufficientStockParts.length > 0) {
      // Rollback: cộng lại quantity cho các parts đã trừ thành công
      for (const { partId, quantity } of updatedParts) {
        try {
          await Part.findByIdAndUpdate(
            partId,
            { $inc: { quantity: quantity } },
            { new: false }
          ).exec();
        } catch (rollbackError) {
          console.error(
            `Lỗi khi rollback quantity cho part ${partId}:`,
            rollbackError.message
          );
        }
      }

      const errorMessages = insufficientStockParts.map(
        (p) => `${p.partName}: cần ${p.required} nhưng chỉ còn ${p.available}`
      );

      throw new DomainError(
        `Không đủ tồn kho cho các phụ tùng sau: ${errorMessages.join(", ")}`,
        ERROR_CODES.INSUFFICIENT_STOCK,
        400
      );
    }

    quote.status = "approved";
    await quote.save();

    serviceOrder.status = "approved";
    await serviceOrder.save();

    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });
    await notificationService.notifyQuoteApproved(serviceOrder, quote);

    return mapToQuoteDTO(quote);
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
      // Khi quote bị rejected, chuyển service order về trạng thái inspection_completed
      // để cho phép staff tạo quote mới
      if (serviceOrder.status === "waiting_customer_approval") {
        serviceOrder.status = "inspection_completed";
        // Xóa waiting_approval_at để reset thời gian chờ phê duyệt
        serviceOrder.waiting_approval_at = undefined;
        await serviceOrder.save();
        
        // Gửi notification về việc thay đổi trạng thái
        await notificationService.notifyServiceOrderStatusChange({ 
          serviceOrder,
          actorClerkId: null 
        });
      }
      
      await notificationService.notifyQuoteRevisionRequested(
        serviceOrder,
        quote
      );
    }

    return mapToQuoteDTO(quote);
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
      quotes: quotes.map(mapToQuoteSummaryDTO),
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
    return mapToQuoteDTO(quote);
  }
}

module.exports = { QuotesService: new QuotesService(), ERROR_CODES };
