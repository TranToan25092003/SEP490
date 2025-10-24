const vehicleModelService = require("../../service/client/vehicle-model.service");

class VehicleModelController {
    async getGroupedModels(req, res) {
        try {
            const data = await vehicleModelService.getModelsGroupedByBrand();
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new VehicleModelController();