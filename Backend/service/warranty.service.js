const Warranty = require("../model/warranty.model");
const { Booking, ServiceOrder, Invoice } = require("../model");
const { Service } = require("../model");
const bookingsService = require("./bookings.service");
const DomainError = require("../errors/domainError");
const ServiceOrderService = require("./service_order.service");
const notificationService = require("./notification.service");

const ERROR_CODES = {
  WARRANTY_NOT_FOUND: "WARRANTY_NOT_FOUND",
  WARRANTY_SERVICE_NOT_FOUND: "WARRANTY_SERVICE_NOT_FOUND",
  INVALID_PART_SELECTION: "INVALID_PART_SELECTION",
  WARRANTY_EXPIRED: "WARRANTY_EXPIRED",
  SERVICE_ORDER_NOT_COMPLETED: "SERVICE_ORDER_NOT_COMPLETED",
  WARRANTY_ALREADY_EXISTS: "WARRANTY_ALREADY_EXISTS",
};

class WarrantyService {
  /**
   * Tìm hoặc tạo dịch vụ bảo hành
   */
  async getOrCreateWarrantyService() {
    let warrantyService = await Service.findOne({
      name: { $regex: /bảo hành/i },
    }).exec();

    if (!warrantyService) {
      warrantyService = new Service({
        name: "Dịch vụ bảo hành",
        base_price: 0,
        description: "Dịch vụ bảo hành cho phụ tùng đã sửa chữa",
        estimated_time: 60, // 1 giờ
      });
      await warrantyService.save();
    }

    return warrantyService;
  }

  /**
   * Kiểm tra xem có thể bảo hành cho service order không
   */
  async checkWarrantyEligibility(serviceOrderId) {
    const serviceOrder = await ServiceOrderService.getServiceOrderById(
      serviceOrderId
    );

    if (!serviceOrder) {
      return {
        eligible: false,
        reason: "Service order không tồn tại",
      };
    }

    // Kiểm tra đơn đã được bảo hành chưa
    const existingWarranty = await Warranty.findOne({
      so_id: serviceOrderId
    }).exec();

    if (existingWarranty) {
      return {
        eligible: false,
        reason: "Đơn sửa chữa này đã được bảo hành rồi",
        alreadyWarrantied: true,
      };
    }

    // Kiểm tra đơn sửa chữa đã hoàn thành chưa
    if (serviceOrder.status !== "completed") {
      return {
        eligible: false,
        reason: "Chỉ có thể bảo hành cho đơn sửa chữa đã hoàn thành",
      };
    }

    // Kiểm tra hóa đơn đã thanh toán chưa
    const invoice = await Invoice.findOne({
      service_order_id: serviceOrderId,
    }).exec();

    if (!invoice) {
      return {
        eligible: false,
        reason: "Không tìm thấy hóa đơn cho đơn sửa chữa này",
      };
    }

    if (invoice.status !== "paid") {
      return {
        eligible: false,
        reason: "Chỉ có thể bảo hành cho các hóa đơn đã thanh toán",
      };
    }

    // Kiểm tra đơn sửa chữa đã hoàn thành trong vòng 7 ngày chưa
    if (!serviceOrder.completedAt) {
      return {
        eligible: false,
        reason: "Không tìm thấy ngày hoàn thành của đơn sửa chữa",
      };
    }

    const completedDate = new Date(serviceOrder.completedAt);
    const now = new Date();
    const daysSinceCompletion = Math.floor(
      (now - completedDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCompletion > 7) {
      return {
        eligible: false,
        reason: `Đã quá 7 ngày kể từ ngày hoàn thành. Còn ${7 - daysSinceCompletion} ngày để bảo hành.`,
        daysRemaining: 0,
        daysSinceCompletion,
      };
    }

    return {
      eligible: true,
      daysRemaining: 7 - daysSinceCompletion,
      daysSinceCompletion,
      completedAt: serviceOrder.completedAt,
    };
  }

  /**
   * Tạo booking bảo hành
   */
  async createWarrantyBooking({
    customerClerkId,
    vehicleId,
    serviceOrderId,
    selectedParts,
    timeSlot,
  }) {
    // Kiểm tra đơn đã được bảo hành chưa
    const existingWarranty = await Warranty.findOne({
      so_id: serviceOrderId
    }).exec();

    if (existingWarranty) {
      throw new DomainError(
        "Đơn sửa chữa này đã được bảo hành rồi",
        ERROR_CODES.WARRANTY_ALREADY_EXISTS,
        400
      );
    }

    // Kiểm tra điều kiện bảo hành
    const eligibility = await this.checkWarrantyEligibility(serviceOrderId);
    if (!eligibility.eligible) {
      throw new DomainError(
        eligibility.reason,
        eligibility.alreadyWarrantied
          ? ERROR_CODES.WARRANTY_ALREADY_EXISTS
          : eligibility.daysSinceCompletion > 7
          ? ERROR_CODES.WARRANTY_EXPIRED
          : ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED,
        400
      );
    }

    // Lấy dịch vụ bảo hành
    const warrantyService = await this.getOrCreateWarrantyService();

    // Tạo booking với dịch vụ bảo hành
    const booking = await bookingsService.createBooking(
      customerClerkId,
      vehicleId,
      [warrantyService._id.toString()],
      timeSlot
    );

    // Lấy service order gốc để lấy thông tin
    const originalServiceOrder = await ServiceOrderService.getServiceOrderById(
      serviceOrderId
    );

    if (!originalServiceOrder) {
      throw new DomainError(
        "Service order không tồn tại",
        ERROR_CODES.WARRANTY_NOT_FOUND,
        404
      );
    }

    // Kiểm tra các phụ tùng được chọn có hợp lệ không
    const validParts = originalServiceOrder.items.filter(
      (item) => item.type === "part"
    );

    const selectedPartIds = selectedParts.map((p) => p.partId);
    const validSelectedParts = validParts.filter((part) =>
      selectedPartIds.includes(part.partId)
    );

    if (validSelectedParts.length !== selectedParts.length) {
      throw new DomainError(
        "Một hoặc nhiều phụ tùng không hợp lệ",
        ERROR_CODES.INVALID_PART_SELECTION,
        400
      );
    }

    // Tạo warranty record
    const warranty = new Warranty({
      so_id: serviceOrderId,
      booking_id: booking._id,
      vehicle_id: vehicleId,
      start_date: new Date(),
      end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 tháng
      status: "active",
      warranty_parts: selectedParts.map((part) => ({
        part_id: part.partId,
        part_name: part.partName,
        quantity: part.quantity || 1,
      })),
      description: `Bảo hành cho ${selectedParts.length} phụ tùng từ đơn ${originalServiceOrder.id}`,
    });

    await warranty.save();

    await notificationService.notifyWarrantyBookingSuccess({
      booking,
      serviceOrderId,
    });

    return {
      warranty,
      booking,
    };
  }

  /**
   * Lấy danh sách warranty của khách hàng
   */
  async getUserWarranties(customerClerkId) {
    // Tìm tất cả bookings của khách hàng
    const customerBookings = await Booking.find({
      customer_clerk_id: customerClerkId,
    }).select("_id").exec();
    
    const bookingIds = customerBookings.map((b) => b._id);
    
    // Tìm service orders của khách hàng
    const customerServiceOrders = await ServiceOrder.find({
      booking_id: { $in: bookingIds },
    }).select("_id").exec();
    
    const serviceOrderIds = customerServiceOrders.map((so) => so._id);
    
    // Tìm warranties có booking_id trong danh sách bookings của khách hàng
    // hoặc có so_id liên kết với service order của khách hàng
    const warranties = await Warranty.find({
      $or: [
        { booking_id: { $in: bookingIds } },
        { so_id: { $in: serviceOrderIds } },
      ],
    })
      .populate("so_id")
      .populate("vehicle_id")
      .populate("booking_id")
      .populate("warranty_parts.part_id")
      .exec();

    return warranties;
  }

  /**
   * Lấy warranty theo ID
   */
  async getWarrantyById(warrantyId) {
    const warranty = await Warranty.findById(warrantyId)
      .populate("so_id")
      .populate("vehicle_id")
      .populate("booking_id")
      .populate("warranty_parts.part_id")
      .exec();

    return warranty;
  }

  /**
   * Cập nhật trạng thái warranty khi đã sử dụng
   */
  async markWarrantyAsUsed(warrantyId) {
    const warranty = await Warranty.findById(warrantyId).exec();
    if (!warranty) {
      throw new DomainError(
        "Warranty không tồn tại",
        ERROR_CODES.WARRANTY_NOT_FOUND,
        404
      );
    }

    warranty.status = "used";
    await warranty.save();

    return warranty;
  }
}

module.exports = {
  WarrantyService: new WarrantyService(),
  ERROR_CODES,
};
