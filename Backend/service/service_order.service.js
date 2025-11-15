const { ServiceOrder, Service, Booking } = require("../model");
const { ServicesService, ERROR_CODES: SERVICE_ERROR_CODES } = require("./services.service");
const DomainError = require("../errors/domainError");
const { UsersService } = require("./users.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_ALREADY_EXISTS: "SERVICE_ORDER_ALREADY_EXISTS",
};

class ServiceOrderService {
  async getAllServiceOrdersByCreatedDateAscending({
    page = 1,
    limit = 20,
    customerName = null,
    status = null,
    startTimestamp = null,
    endTimestamp = null
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
      customerIdsToMatch = await UsersService.getUserIdsByFullName(customerName);
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

    const [serviceOrders, totalItems] = await Promise.all([
      ServiceOrder.aggregate([
        { $match: filters },
        {
          $lookup: {
            from: "bookings",
            localField: "booking_id",
            foreignField: "_id",
            as: "booking"
          }
        },
        { $unwind: "$booking" },
        {
          $lookup: {
            from: "vehicles",
            localField: "booking.vehicle_id",
            foreignField: "_id",
            as: "vehicle"
          }
        },
        { $unwind: "$vehicle" },
        ...(customerName ? [{
          $match: {
            "booking.customer_clerk_id": { $in: customerIdsToMatch }
          }
        }] : [])
      ])
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ServiceOrder.countDocuments(filters).exec()
    ]);

    console.log(JSON.stringify(serviceOrders, null, 2));

    const totalPages = Math.ceil(totalItems / limit);
    const customerIds = serviceOrders.map(so => so.booking.customer_clerk_id.toString());
    const userMap = await UsersService.getFullNamesByIds(customerIds);

    return {
      serviceOrders: serviceOrders.map(so => ({
        id: so._id.toString(),
        bookingId: so.booking._id.toString(),
        licensePlate: so.vehicle.license_plate,
        customerName: userMap[so.booking.customer_clerk_id.toString()],
        status: so.status,
        createdAt: so.createdAt,
        completedAt: so.completed_at,
        estimatedCompletedAt: so.expected_completion_time
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

    // Tìm warranty liên quan đến booking này (nếu đây là warranty booking)
    const Warranty = require("../model/warranty.model");
    const warranty = await Warranty.findOne({
      booking_id: serviceOrder.booking_id._id
    })
      .populate("warranty_parts.part_id")
      .exec();

    // Lấy danh sách warranty part IDs
    const warrantyPartIds = warranty && warranty.warranty_parts
      ? warranty.warranty_parts.map(wp => wp.part_id?._id?.toString())
      : [];

    serviceOrder.items = items.map(item => {
      // Nếu item là warranty part, đảm bảo giá = 0
      const isWarrantyPart = item.type === "part" && warrantyPartIds.includes(item.partId);
      return {
        item_type: item.type,
        service_id: item.serviceId,
        part_id: item.partId,
        name: item.name,
        price: isWarrantyPart ? 0 : item.price, // Warranty parts luôn có giá = 0
        quantity: item.quantity
      };
    });
    await serviceOrder.save();

    return serviceOrder;
  }

  async getServiceOrderById(serviceOrderId) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate({
        path: "booking_id",
        populate: { path: "vehicle_id" }
      })
      .populate("items.part_id")
      .exec();

    if (!serviceOrder) {
      return null;
    }

    const customerMap = await UsersService.getFullNamesByIds([serviceOrder.booking_id.customer_clerk_id]);
    const customerName = customerMap[serviceOrder.booking_id.customer_clerk_id];
    const licensePlateInfo = serviceOrder.booking_id.vehicle_id.license_plate;

    // Tìm warranty liên quan đến booking này (nếu đây là warranty booking)
    const Warranty = require("../model/warranty.model");
    const warranty = await Warranty.findOne({
      booking_id: serviceOrder.booking_id._id
    })
      .populate("warranty_parts.part_id")
      .exec();

    // Tạo items từ service order
    const items = serviceOrder.items.map(item => ({
      type: item.item_type,
      serviceId: item.service_id?.toString(),
      partId: item.part_id?._id?.toString(),
      partName: item.part_id?.name,
      // Đối với phụ tùng, sử dụng part_id.name nếu item.name không có
      name: item.item_type === "part" 
        ? (item.part_id?.name || item.name) 
        : item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Nếu có warranty, thêm warranty parts vào items với giá = 0
    if (warranty && warranty.warranty_parts && warranty.warranty_parts.length > 0) {
      warranty.warranty_parts.forEach(wp => {
        // Kiểm tra xem part này đã có trong items chưa
        const existingPartIndex = items.findIndex(
          item => item.type === "part" && item.partId === wp.part_id?._id?.toString()
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
            quantity: wp.quantity || 1
          });
        }
      });
    }

    return {
      id: serviceOrder._id.toString(),
      customerName: customerName,
      customerClerkId: serviceOrder.booking_id.customer_clerk_id,
      licensePlate: licensePlateInfo,
      vehicleId: serviceOrder.booking_id.vehicle_id._id.toString(),
      items: items,
      status: serviceOrder.status,
      createdAt: serviceOrder.createdAt,
      completedAt: serviceOrder.completed_at,
      estimatedCompletedAt: serviceOrder.expected_completion_time
    };
  }

  async _createServiceOrderFromBooking(staffId, bookingId) {
    const existingOrder = await ServiceOrder.findOne({ booking_id: bookingId }).exec();
    if (existingOrder) {
      throw new DomainError(
        "Lệnh đã tồn tại cho booking này",
        ERROR_CODES.SERVICE_ORDER_ALREADY_EXISTS,
        409
      );
    }

    const booking = await Booking.findById(bookingId).exec();

    //clone to lock in price
    const items = await this.convertServiceIdsToServiceItems(booking.service_ids);

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

  async convertServiceIdsToServiceItems(serviceIds) {
    const nonDuplicateServiceIds = [...new Set(serviceIds.map(String))];
    const validServiceIds = await ServicesService.getValidServiceIds(nonDuplicateServiceIds);

    if (validServiceIds.length !== nonDuplicateServiceIds.length) {
      throw new DomainError(
        "Một hoặc nhiều dịch vụ không hợp lệ",
        SERVICE_ERROR_CODES.SERVICE_NOT_FOUND,
        404
      );
    }

    const services = await Service.find({ _id: { $in: validServiceIds } }).exec();
    return services.map((service) => {
      // Nếu là dịch vụ bảo hành, giá = 0
      const isWarrantyService = /bảo hành/i.test(service.name);
      return {
        price: isWarrantyService ? 0 : service.base_price,
        quantity: 1,
        service_id: service._id,
        name: service.name,
        item_type: "service"
      };
    });
  }
}

module.exports = new ServiceOrderService();
