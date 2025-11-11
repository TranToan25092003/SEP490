const { Vehicle, Booking } = require("../model");

function mapToVehicleDTO(vehicle) {
  return {
    id: vehicle._id,
    licensePlate: vehicle.license_plate,
    odoReading: vehicle.odo_reading,
    year: vehicle.year,
    brand: vehicle.model_id?.brand,
    model: vehicle.model_id?.name,
  };
}

class VehiclesService {
  async getUserVehiclesWithAvailability(userId) {
    const vehicles = await Vehicle.find({ OwnerClerkId: userId })
      .populate("model_id")
      .lean();

    const vehicleIds = vehicles.map((v) => v._id.toString());
    const vehicleIdsInUse = await this.getVehiclesInUse(vehicleIds);

    return vehicles.map((vehicle) => ({
      ...mapToVehicleDTO(vehicle),
      isAvailable: !vehicleIdsInUse.includes(vehicle._id.toString()),
    }));
  }

  async getVehicleById(vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId).populate("model_id").lean();
    if (!vehicle) {
      return null;
    }
    return mapToVehicleDTO(vehicle);
  }

  async getVehiclesInUse(vehicleIds) {
    const bookings = await Booking.find({
      vehicle_id: { $in: vehicleIds },
      status: { $in: ["booked", "in_progress"] }
    }).exec();

    return vehicleIds.filter(vid => {
      return bookings.some(b => b.vehicle_id.toString() === vid);
    });
  }
}

module.exports = {
  VehiclesService: new VehiclesService(),
  mapToVehicleDTO
}
