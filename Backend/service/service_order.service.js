const { ServiceOrder, Service, Booking } = require("../model");
const { ServicesService, ERROR_CODES: SERVICE_ERROR_CODES } = require("./services.service");
const DomainError = require("../errors/domainError");
const { UsersService } = require("./users.service");

const ERROR_CODES = {
  SERVICE_ORDER_NOT_FOUND: "SERVICE_ORDER_NOT_FOUND",
  SERVICE_ORDER_ALREADY_EXISTS: "SERVICE_ORDER_ALREADY_EXISTS",
};

class ServiceOrderService {
  async getAllServiceOrdersByCreatedDateAscending() {
    const serviceOrders = await ServiceOrder.find()
      .populate({
        path: "booking_id",
        populate: { path: "vehicle_id" }
      })
      .sort({ createdAt: 1 })
      .exec();

    const customerIds = serviceOrders.map(so => so.booking_id.customer_clerk_id.toString());
    const userMap = await UsersService.getFullNamesByIds(customerIds);
    return serviceOrders.map(so => ({
      id: so._id.toString(),
      bookingId: so.booking_id._id.toString(),
      licensePlate: so.booking_id.vehicle_id.license_plate,
      customerName: userMap[so.booking_id.customer_clerk_id.toString()],
      status: so.status,
      createdAt: so.createdAt,
      completedAt: so.completed_at,
      estimatedCompletedAt: so.expected_completion_time
    }));
  }

  async updateServiceOrderItems(serviceOrderId, items) {
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).exec();
    if (!serviceOrder) {
      throw new DomainError(
        "Lệnh không tồn tại",
        ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        404
      );
    }

    serviceOrder.items = items.map(item => ({
      item_type: item.type,
      service_id: item.serviceId,
      part_id: item.partId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
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

    return {
      id: serviceOrder._id.toString(),
      customerName: customerName,
      customerClerkId: serviceOrder.booking_id.customer_clerk_id,
      licensePlate: licensePlateInfo,
      vehicleId: serviceOrder.booking_id.vehicle_id._id.toString(),
      items: serviceOrder.items.map(item => ({
        type: item.item_type,
        serviceId: item.service_id?.toString(),
        partId: item.part_id?._id?.toString(),
        partName: item.part_id?.name,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
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
    return services.map((service) => ({
      price: service.base_price,
      quantity: 1,
      service_id: service._id,
      name: service.name,
      item_type: "service"
    }));
  }
}

module.exports = new ServiceOrderService();
