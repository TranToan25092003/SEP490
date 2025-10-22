const Vehicle = require("../model/vehicle.model");

class VehiclesService {
  async getUserVehicles(userId) {
    const vehicles = await Vehicle.find({ OwnerClerkId: userId })
      .populate("model_id")
      .lean();

    return vehicles.map((vehicle) => ({
      id: vehicle._id,
      licensePlate: vehicle.license_plate,
      odoReading: vehicle.odo_reading,
      year: vehicle.year,
      brand: vehicle.model_id?.brand,
      model: vehicle.model_id?.name,
    }));
  }
}

module.exports = new VehiclesService();
