const { ServiceOrder, Service, Booking } = require("../model");
const {
  ServicesService,
  ERROR_CODES: SERVICE_ERROR_CODES,
} = require("./services.service");
const DomainError = require("../errors/domainError");
const { UsersService } = require("./users.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_ALREADY_EXISTS: "SERVICE_ORDER_ALREADY_EXISTS",
  INVALID_WALK_IN_PAYLOAD: "INVALID_WALK_IN_PAYLOAD",
};

class ServiceOrderService {
  async getAllServiceOrdersByCreatedDateAscending({
    page = 1,
    limit = 20,
    customerName = null,
    status = null,
    startTimestamp = null,
    endTimestamp = null,
  }) {
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (startTimestamp) {
      filters.createdAt = { $gte: new Date(startTimestamp) };
    }

    if (endTimestamp) {
      if (filters.createdAt) {
        filters.createdAt.$lte = new Date(endTimestamp);
      } else {
        filters.createdAt = { $lte: new Date(endTimestamp) };
      }
    }

    let customerIdsToMatch = [];
    if (customerName) {
      customerIdsToMatch = await UsersService.getUserIdsByFullName(
        customerName
      );
      if (customerIdsToMatch.length === 0) {
        return {
          serviceOrders: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
        };
      }
    }

    const pipeline = [
      { $match: filters },
      {
        $lookup: {
          from: "bookings",
          localField: "booking_id",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: {
          path: "$booking",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "booking.vehicle_id",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      {
        $unwind: {
          path: "$vehicle",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (customerName) {
      const regex = new RegExp(customerName, "i");
      const matchConditions = [{ "walk_in_customer.name": regex }];
      if (customerIdsToMatch.length > 0) {
        matchConditions.push({
          "booking.customer_clerk_id": { $in: customerIdsToMatch },
        });
      }
      pipeline.push({ $match: { $or: matchConditions } });
    }

    // Custom sort: completed status goes to bottom, others sorted by createdAt ascending
    pipeline.push({
      $addFields: {
        sortPriority: {
          $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
        },
      },
    });
    pipeline.push({
      $sort: { sortPriority: 1, createdAt: 1 },
    });

    const [serviceOrders, totalItems] = await Promise.all([
      ServiceOrder.aggregate(pipeline)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrder.countDocuments(filters).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const bookingCustomerIds = [
      ...new Set(
        serviceOrders
          .filter((so) => so.booking?.customer_clerk_id)
          .map((so) => so.booking.customer_clerk_id.toString())
      ),
    ];
    const userMap = bookingCustomerIds.length
      ? await UsersService.getFullNamesByIds(bookingCustomerIds)
      : {};

    return {
      serviceOrders: serviceOrders.map((so) => ({
        id: so._id.toString(),
        bookingId: so.booking?._id?.toString() || null,
        orderNumber: so.orderNumber || null,
        isWalkIn: !!so.is_walk_in,
        licensePlate: so.is_walk_in
          ? so.walk_in_vehicle?.license_plate || "—"
          : so.vehicle?.license_plate || "—",
        customerName: so.is_walk_in
          ? so.walk_in_customer?.name || "Khách vãng lai"
          : userMap[so.booking?.customer_clerk_id?.toString()] ||
            "Không xác định",
        status: so.status,
        createdAt: so.createdAt,
        completedAt: so.completed_at,
        estimatedCompletedAt: so.expected_completion_time,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  async updateServiceOrderItems(serviceOrderId, items) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate("booking_id")
      .exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    let warranty = null;
    if (serviceOrder.booking_id?._id) {
      const Warranty = require("../model/warranty.model");
      warranty = await Warranty.findOne({
        booking_id: serviceOrder.booking_id._id,
      })
        .populate("warranty_parts.part_id")
        .exec();
    }

    const warrantyPartIds =
      warranty && warranty.warranty_parts
        ? warranty.warranty_parts.map((wp) => wp.part_id?._id?.toString())
        : [];

    serviceOrder.items = items.map((item) => {
      const isWarrantyPart =
        item.type === "part" && warrantyPartIds.includes(item.partId);
      return {
        item_type: item.type,
        service_id: item.serviceId,
        part_id: item.partId,
        name: item.name,
        price: isWarrantyPart ? 0 : item.price, // Warranty parts luôn có giá = 0
        quantity: item.quantity,
      };
    });
    await serviceOrder.save();

    return serviceOrder;
  }

  async getServiceOrderById(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate({
        path: "booking_id",
        populate: { path: "vehicle_id" },
      })
      .populate("items.part_id")
      .exec();

    if (!serviceOrder) {
      return null;
    }

    let customerName = serviceOrder.walk_in_customer?.name || "Khách vãng lai";
    let customerClerkId = null;
    let customerPhone = serviceOrder.walk_in_customer?.phone || null;
    let licensePlateInfo = serviceOrder.walk_in_vehicle?.license_plate || "—";
    let vehicleId = null;

    if (serviceOrder.booking_id) {
      customerClerkId = serviceOrder.booking_id.customer_clerk_id;
      const customerMap = await UsersService.getFullNamesByIds([
        customerClerkId,
      ]);
      customerName =
        customerMap[serviceOrder.booking_id.customer_clerk_id] ||
        customerName ||
        "Không xác định";
      licensePlateInfo =
        serviceOrder.booking_id.vehicle_id?.license_plate || licensePlateInfo;
      vehicleId =
        serviceOrder.booking_id.vehicle_id?._id?.toString() || vehicleId;
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

    // Tạo items từ service order
    const items = serviceOrder.items.map((item) => ({
      type: item.item_type,
      serviceId: item.service_id?.toString(),
      partId: item.part_id?._id?.toString(),
      partName: item.part_id?.name,
      // Đối với phụ tùng, sử dụng part_id.name nếu item.name không có
      name:
        item.item_type === "part" ? item.part_id?.name || item.name : item.name,
      price: item.price,
      quantity: item.quantity,
    }));

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
            item.type === "part" && item.partId === wp.part_id?._id?.toString()
        );

        if (existingPartIndex >= 0) {
          // Nếu đã có, đảm bảo giá = 0
          items[existingPartIndex].price = 0;
        } else {
          // Nếu chưa có, thêm mới với giá = 0
          items.push({
            type: "part",
            partId: wp.part_id?._id?.toString(),
            partName: wp.part_name || wp.part_id?.name,
            name: wp.part_name || wp.part_id?.name,
            price: 0, // Giá bảo hành = 0
            quantity: wp.quantity || 1,
          });
        }
      });
    }

    return {
      id: serviceOrder._id.toString(),
      isWalkIn: !!serviceOrder.is_walk_in,
      orderNumber: serviceOrder.orderNumber || null,
      customerName: customerName,
      customerPhone,
      customerClerkId,
      licensePlate: licensePlateInfo,
      vehicleId,
      walkInCustomer: serviceOrder.walk_in_customer || null,
      walkInVehicle: serviceOrder.walk_in_vehicle || null,
      walkInNote: serviceOrder.walk_in_note || null,
      items: items,
      status: serviceOrder.status,
      createdAt: serviceOrder.createdAt,
      completedAt: serviceOrder.completed_at,
      estimatedCompletedAt: serviceOrder.expected_completion_time,
      cancelledAt: serviceOrder.cancelled_at || null,
      cancelledBy: serviceOrder.cancelled_by || null,
      cancelReason: serviceOrder.cancel_reason || null,
    };
  }

  async _createServiceOrderFromBooking(staffId, bookingId) {
    const existingOrder = await ServiceOrder.findOne({
      booking_id: bookingId,
    }).exec();
    if (existingOrder) {
      throw new DomainError(
        "Lệnh đã tồn tại cho booking này",
        ERROR_CODES.SERVICE_ORDER_ALREADY_EXISTS,
        409
      );
    }

    const booking = await Booking.findById(bookingId).exec();

    //clone to lock in price
    const items = await this.convertServiceIdsToServiceItems(
      booking.service_ids
    );

    const serviceOrder = new ServiceOrder({
      staff_clerk_id: staffId,
      booking_id: booking._id,
      items: items,
    });

    await serviceOrder.save();

    booking.status = "in_progress";
    booking.service_order_id = serviceOrder._id;
    await booking.save();
  }

  async createWalkInServiceOrder({
    staffId,
    customer = {},
    vehicle = {},
    serviceIds = [],
    note = null,
  }) {
    if (!staffId) {
      throw new DomainError(
        "Không xác định được nhân viên tạo lệnh",
        ERROR_CODES.INVALID_WALK_IN_PAYLOAD,
        403
      );
    }

    if (!customer.name || !customer.phone || !vehicle.licensePlate) {
      throw new DomainError(
        "Vui lòng cung cấp đầy đủ thông tin khách hàng và xe",
        ERROR_CODES.INVALID_WALK_IN_PAYLOAD,
        400
      );
    }

    if (!serviceIds || serviceIds.length === 0) {
      throw new DomainError(
        "Vui lòng chọn ít nhất một dịch vụ",
        ERROR_CODES.INVALID_WALK_IN_PAYLOAD,
        400
      );
    }

    const items = await this.convertServiceIdsToServiceItems(serviceIds);

    const serviceOrder = new ServiceOrder({
      staff_clerk_id: staffId,
      items,
      is_walk_in: true,
      walk_in_customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address || null,
      },
      walk_in_vehicle: {
        license_plate: vehicle.licensePlate,
        model: vehicle.model || null,
        color: vehicle.color || null,
      },
      walk_in_note: note,
    });

    await serviceOrder.save();
    return this.getServiceOrderById(serviceOrder._id);
  }

  async convertServiceIdsToServiceItems(serviceIds) {
    const nonDuplicateServiceIds = [...new Set(serviceIds.map(String))];
    const validServiceIds = await ServicesService.getValidServiceIds(
      nonDuplicateServiceIds
    );

    if (validServiceIds.length !== nonDuplicateServiceIds.length) {
      throw new DomainError(
        "Một hoặc nhiều dịch vụ không hợp lệ",
        SERVICE_ERROR_CODES.SERVICE_NOT_FOUND,
        404
      );
    }

    const services = await Service.find({
      _id: { $in: validServiceIds },
    }).exec();
    return services.map((service) => {
      // Nếu là dịch vụ bảo hành, giá = 0
      const isWarrantyService = /bảo hành/i.test(service.name);
      return {
        price: isWarrantyService ? 0 : service.base_price,
        quantity: 1,
        service_id: service._id,
        name: service.name,
        item_type: "service",
      };
    });
  }

  async cancelServiceOrder(serviceOrderId, staffId, cancelReason) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();

    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh sửa chữa không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    if (serviceOrder.status === "cancelled") {
      throw new DomainError(
        "Lệnh sửa chữa đã bị hủy",
        "SERVICE_ORDER_ALREADY_CANCELLED",
        400
      );
    }

    if (serviceOrder.status === "completed") {
      throw new DomainError(
        "Không thể hủy lệnh sửa chữa đã hoàn thành",
        "SERVICE_ORDER_ALREADY_COMPLETED",
        400
      );
    }

    // Cập nhật trạng thái
    serviceOrder.status = "cancelled";
    serviceOrder.cancelled_by = "staff";
    serviceOrder.cancel_reason = cancelReason || "Nhân viên hủy lệnh";
    serviceOrder.cancelled_at = new Date();
    await serviceOrder.save();

    // Nếu có booking liên quan, cập nhật trạng thái booking
    if (serviceOrder.booking_id) {
      const booking = await Booking.findById(serviceOrder.booking_id).exec();
      if (
        booking &&
        booking.status !== "cancelled" &&
        booking.status !== "completed"
      ) {
        booking.status = "cancelled";
        booking.cancelled_by = "staff";
        booking.cancel_reason = cancelReason || "Lệnh sửa chữa bị hủy";
        booking.cancelled_at = new Date();
        await booking.save();
      }
    }

    // Gửi thông báo
    const notificationService = require("./notification.service");
    await notificationService.notifyServiceOrderStatusChange({ serviceOrder });
    if (serviceOrder.booking_id) {
      const booking = await Booking.findById(serviceOrder.booking_id).exec();
      if (booking) {
        await notificationService.notifyCustomerBookingCancelled(
          booking,
          "staff",
          cancelReason || "Lệnh sửa chữa bị hủy"
        );
      }
    }

    return this.getServiceOrderById(serviceOrderId);
  }
}

module.exports = new ServiceOrderService();
