const modelService = require("../../service/admin/model.service");

class ModelController {
    /**
     * Controller để tạo một mẫu xe mới
     */
    async createModel(req, res) {
        try {
            const newModel = await modelService.createModel(req.body);
            res.status(201).json({
                success: true,
                data: newModel,
                message: "Model created successfully.",
            });
        } catch (error) {
            console.error("Error creating model:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Controller để lấy danh sách tất cả mẫu xe (cho Admin)
     */
    async getAllModels(req, res) {
        try {
            const result = await modelService.getAllModels(req.query);
            res.status(200).json({
                success: true,
                data: result.models,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error("Error fetching models:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Controller để lấy một mẫu xe bằng ID
     */
    async getModelById(req, res) {
        try {
            const modelId = req.params.id;
            const model = await modelService.getModelById(modelId);

            if (!model) {
                return res.status(404).json({
                    success: false,
                    message: "Model not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: model,
            });
        } catch (error) {
            console.error("Error fetching model by ID:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Controller để cập nhật một mẫu xe bằng ID
     */
    async updateModel(req, res) {
        try {
            const modelId = req.params.id;
            const updateData = req.body;

            const updatedModel = await modelService.updateModel(modelId, updateData);

            if (!updatedModel) {
                return res.status(404).json({
                    success: false,
                    message: "Model not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: updatedModel,
                message: "Model updated successfully.",
            });
        } catch (error) {
            console.error("Error updating model:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Controller để xóa một mẫu xe bằng ID
     */
    async deleteModel(req, res) {
        try {
            const modelId = req.params.id;
            const deletedModel = await modelService.deleteModel(modelId);

            if (!deletedModel) {
                return res.status(404).json({
                    success: false,
                    message: "Model not found.",
                });
            }

            res.status(200).json({
                success: true,
                message: "Model deleted successfully.",
                data: deletedModel,
            });
        } catch (error) {
            console.error("Error deleting model:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new ModelController();