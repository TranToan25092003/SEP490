const { ModelVehicle } = require("../../model");


class VehicleModelService {
    async getModelsGroupedByBrand() {
        try {
            const groupedModels = await ModelVehicle.aggregate([
                {
                    $match: { status: "active" }
                },
                {
                    $sort: { name: 1 }
                },
                {
                    $group: {
                        _id: "$brand",
                        models: {
                            $push: {
                                _id: "$_id",
                                name: "$name",
                                brand: "$brand"
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        brand: "$_id",
                        models: 1,
                    },
                },
                {
                    $sort: { brand: 1 }
                }
            ]);

            return groupedModels;
        } catch (error) {
            throw new Error(`Failed to fetch and group models: ${error.message}`);
        }
    }
}


module.exports = new VehicleModelService();
