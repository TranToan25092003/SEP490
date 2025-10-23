const vehiclesService = require("../service/vehicles.service");
const DomainError = require("../errors/domainError");

class VehiclesController {
  async getUserVehicles(req, res, next) {
    try {
      const userId = req.userId;

      const vehicles = await vehiclesService.getUserVehicles(userId);

      res.status(200).json({
        data: vehicles,
        message: "Vehicles retrieved successfully",
      });
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code,
        });
      }
      next(error);
    }
  }

}

module.exports = new VehiclesController();
