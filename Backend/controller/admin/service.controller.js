const serviceService = require("../../service/admin/service.service"); 

class ServiceController {
    async createService(req, res) {
        try {
            const newService = await serviceService.createService(req.body);
            res.status(201).json({
                success: true,
                data: newService,
                message: "Service created successfully.",
            });
        } catch (error) {
            console.error("Error creating service:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getAllServices(req, res) {
        try {
            const result = await serviceService.getAllServices(req.query);
            res.status(200).json({
                success: true,
                data: result.services,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error("Error fetching services:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getServiceById(req, res) {
        try {
            const serviceId = req.params.id;
            const service = await serviceService.getServiceById(serviceId);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: service,
            });
        } catch (error) {
            console.error("Error fetching service by ID:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async updateService(req, res) {
        try {
            const serviceId = req.params.id;
            const updateData = req.body;

            delete updateData.createdAt;
            delete updateData.updatedAt;

            const updatedService = await serviceService.updateService(serviceId, updateData);

            if (!updatedService) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: updatedService,
                message: "Service updated successfully.",
            });
        } catch (error) {
            console.error("Error updating service:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * Controller để xóa một dịch vụ bằng ID
     */
    async deleteService(req, res) {
        try {
            const serviceId = req.params.id;
            const deletedService = await serviceService.deleteService(serviceId);

            if (!deletedService) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found.",
                });
            }

            res.status(200).json({
                success: true,
                message: "Service deleted successfully.",
                data: deletedService,
            });
        } catch (error) {
            console.error("Error deleting service:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new ServiceController();
