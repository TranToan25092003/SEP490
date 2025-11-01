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
}

class ServicesService {
  /**
   * This function retrieves all services from the database
   * @returns {import("./types").ServiceDTO[]} - An array of services
   */
  async getAllServices() {
    const services = await Service.find({}).exec();
    return services.map(mapServiceToDTO);
  }

  /**
   * This function retrieves valid service IDs from the database
   * @param {string[]} serviceIds - Array of service IDs to validate
   * @returns {string[]} - An array of valid service IDs
   */
  async getValidServiceIds(serviceIds) {
    const services = await Service.find({ _id: { $in: serviceIds } }).exec();
    return services.filter(s => serviceIds.includes(s._id.toString())).map(s => s._id.toString());
  }
}

module.exports = {
  ServicesService: new ServicesService(),
  mapServiceToDTO,
  ERROR_CODES
}
