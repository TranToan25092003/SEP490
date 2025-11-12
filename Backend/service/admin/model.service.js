const { ModelVehicle, Vehicle } = require("../../model");

class ModelService {

    async createModel(modelData) {
        const { name, brand } = modelData;

        // Kiểm tra các trường bắt buộc
        if (!name || !brand) {
            throw new Error("Missing required fields: name and brand are required.");
        }

        try {
            const newModel = new ModelVehicle(modelData);
            const savedModel = await newModel.save();
            return savedModel;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error("A model with this name/brand might already exist.");
            }
            throw new Error(`Failed to create model: ${error.message}`);
        }
    }

    async getAllModels(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "brand",
            sortOrder = "asc",
        } = query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        try {
            const models = await ModelVehicle.find(filter)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();

            const total = await ModelVehicle.countDocuments(filter);

            return {
                models,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to fetch models: ${error.message}`);
        }
    }


    async getModelById(modelId) {
        try {
            const model = await ModelVehicle.findById(modelId).lean();
            if (!model) {
                return null;
            }
            return model;
        } catch (error) {
            throw new Error(`Failed to fetch model by ID: ${error.message}`);
        }
    }

    async updateModel(modelId, updateData) {
        try {
            const updatedModel = await ModelVehicle.findByIdAndUpdate(
                modelId,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();

            if (!updatedModel) {
                return null;
            }
            return updatedModel;
        } catch (error) {
            throw new Error(`Failed to update model: ${error.message}`);
        }
    }

    async deleteModel(modelId) {
        try {

            const vehiclesUsingModel = await Vehicle.countDocuments({ model_id: modelId });
            if (vehiclesUsingModel > 0) {
                throw new Error("Không thể xóa model: Model này đang liên kết với một xe trong hệ thống.");
            }
            const deletedModel = await ModelVehicle.findByIdAndDelete(modelId);

            if (!deletedModel) {
                return null;
            }
            return deletedModel;
        } catch (error) {
            throw new Error(`Failed to delete model: ${error.message}`);
        }
    }

}

module.exports = new ModelService();