const { Vehicle, ServiceOrder } = require("../model");

class VehiclesService {
  async getUserVehicles(userId) {
    const vehicles = await Vehicle.find({ OwnerClerkId: userId })
      .populate("model_id")
      .lean();

    const vehicleIds = vehicles.map((v) => v._id.toString());
    const vehicleIdsInUse = await this.getVehiclesInUse(vehicleIds);

    return vehicles.map((vehicle) => ({
      id: vehicle._id,
      licensePlate: vehicle.license_plate,
      odoReading: vehicle.odo_reading,
      year: vehicle.year,
      brand: vehicle.model_id?.brand,
      model: vehicle.model_id?.name,
      isAvailable: !vehicleIdsInUse.includes(vehicle._id.toString()),
    }));
  }

  /**
   * Filters the given vehicle IDs to find which ones are currently in use
   * in active service orders.
   * @param {Array<string>} vehicleIds
   * @returns {Array<string>} - Array of vehicle IDs that are currently in use.
   */
  async getVehiclesInUse(vehicleIds) {
    const serviceOrders = await ServiceOrder.find({
      vehicle_id: { $in: vehicleIds },
      status: { $in: ["pending", "confirmed", "in_progress"] }
    }).exec();

    return vehicleIds.filter(vid => {
      return serviceOrders.some(so => so.vehicle_id.toString() === vid);
    });
  }
}

module.exports = new VehiclesService();
