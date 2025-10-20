const partService = require("../../service/client/part.service");


class PartController {
    // get all parts by client
    async getAllPartsByClient(req, res) {
        try {
            const result = await partService.getAllPartsByClient(req.query);

            res.status(200).json({
                success: true,
                data: result.parts,
                pagination: result.pagination,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    // Get part by id
    async getPartByIdByClient(req, res) {
        try {
            const { id } = req.params;
            const part = await partService.getPartByIdByClient(id);

            res.status(200).json({
                success: true,
                data: part,
            });
        } catch (error) {
            const statusCode = error.message.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new PartController();
