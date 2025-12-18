const { Vehicle, Booking } = require("../model");
const DomainError = require("../errors/domainError");

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

const ERROR_CODES = {
  VEHICLE_NOT_FOUND: "VEHICLE_NOT_FOUND",
  VEHICLE_NOT_BELONG_TO_USER: "VEHICLE_NOT_BELONG_TO_USER"
}

class VehiclesService {
  async getUserVehiclesWithAvailability(userId, hiddenVehicleIds = []) {
    const vehicles = await Vehicle.find({ OwnerClerkId: userId, _id: { $nin: hiddenVehicleIds } })
      .populate("model_id")
      .lean();

    if (!vehicles.length) return [];

    const vehicleIds = vehicles.map((v) => v._id.toString());
    const activeBookingsMap = await this.getActiveBookingsMap(vehicleIds);

    return vehicles.map((vehicle) => {
      const vehicleId = vehicle._id.toString();
      const activeBooking = activeBookingsMap[vehicleId];

      return {
        ...mapToVehicleDTO(vehicle),
        activeBooking: activeBooking
          ? {
              id: activeBooking._id.toString(),
              status: activeBooking.status,
              slotStartTime: activeBooking.slot_start_time,
              slotEndTime: activeBooking.slot_end_time,
              serviceOrderId: activeBooking.service_order_id
                ? activeBooking.service_order_id.toString()
                : null,
            }
          : null,
      };
    });
  }

  async getVehicleById(vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId).populate("model_id").lean();
    if (!vehicle) {
      return null;
    }
    return mapToVehicleDTO(vehicle);
  }

  async getActiveBookingsMap(vehicleIds) {
    if (!vehicleIds.length) return {};

    const bookings = await Booking.find({
      vehicle_id: { $in: vehicleIds },
      status: { $in: ["booked", "in_progress", "checked_in"] },
    })
      .sort({ createdAt: -1 })
      .select(
        "_id vehicle_id status slot_start_time slot_end_time service_order_id"
      )
      .lean();

    return bookings.reduce((acc, booking) => {
      const vehicleId = booking.vehicle_id.toString();
      if (!acc[vehicleId]) {
        acc[vehicleId] = booking;
      }
      return acc;
    }, {});
  }

  async verifyVehicleOwnership(vehicleId, userId) {
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) {
      throw new DomainError(
        "Phương tiện không tồn tại",
        ERROR_CODES.VEHICLE_NOT_FOUND,
        404
      );
    }

    if (vehicle.OwnerClerkId !== userId) {
      throw new DomainError(
        "Phương tiện không thuộc về người dùng",
        ERROR_CODES.VEHICLE_NOT_BELONG_TO_USER,
        403
      );
    }
  }
}

module.exports = {
  VehiclesService: new VehiclesService(),
  mapToVehicleDTO
}
