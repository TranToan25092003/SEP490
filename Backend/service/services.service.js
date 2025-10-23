const { Service, ServiceOrder } = require("../model");

function mapServiceToDTO(service) {
  return {
    id: service._id,
    name: service.name,
    basePrice: service.base_price,
    description: service.description,
    estimatedTimeInMinutes: service.estimated_time,
  };
}

class ServicesService {
  async getAllServices() {
    const services = await Service.find({}).exec();
    return services.map(mapServiceToDTO);
  }

  async getServiceForBookingById(bookingId) {
    const order = await ServiceOrder.findById(bookingId).exec();
    if (!order) {
      throw new Error("Service not found");
    }
    const services = await Service.find({
      _id: { $in: order.service_ids },
    }).exec();
    return services.map(mapServiceToDTO);
  }
}

module.exports = new ServicesService();
