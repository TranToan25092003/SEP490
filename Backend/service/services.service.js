const { Service } = require("../model");

function mapServiceToDTO(service) {
  return {
    id: service._id,
    name: service.name,
    basePrice: service.base_price,
    description: service.description,
    estimatedTimeInMinutes: service.estimated_time,
  };
}

const ERROR_CODES = {
  SERVICE_NOT_FOUND: "SERVICE_NOT_FOUND",
};

class ServicesService {
  async getAllServices() {
    // Lọc bỏ dịch vụ bảo hành và chỉ lấy dịch vụ active
    const services = await Service.find({
      name: { $not: { $regex: /bảo hành/i } },
      status: "active",
    }).exec();
    return services.map(mapServiceToDTO);
  }

  async getValidServiceIds(serviceIds) {
    const services = await Service.find({ _id: { $in: serviceIds } }).exec();
    return services.map((s) => s._id.toString());
  }
}

module.exports = {
  ServicesService: new ServicesService(),
  mapServiceToDTO,
  ERROR_CODES,
};
