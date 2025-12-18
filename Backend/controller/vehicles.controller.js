const { VehiclesService } = require("../service/vehicles.service");

class VehiclesController {
  async getVehiclesWithAvailability(req, res, next) {
    try {
      const userId = req.userId;

      const hiddenVehicleIdsRaw =
        req.user?.publicMetadata?.hiddenVehicleIds || [];
      const hiddenVehicleIds = Array.isArray(hiddenVehicleIdsRaw)
        ? hiddenVehicleIdsRaw.map((id) => id.toString())
        : [];

      const vehicles = await VehiclesService.getUserVehiclesWithAvailability(userId, hiddenVehicleIds);

      res.status(200).json({
        data: vehicles,
        message: "Vehicles retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new VehiclesController();
