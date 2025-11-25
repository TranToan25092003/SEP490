const { Part } = require("../../model");
const mongoose = require("mongoose")

class PartService {
    //Get all parts for client
    async getAllPartsByClient(query = {}) {
        const {
            page = 1,
            limit = 9,
            search = "",
            brand = "",
            vehicleModel = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = query;

        const filter = { status: "active" };

        if (vehicleModel && !mongoose.Types.ObjectId.isValid(vehicleModel)) {
            throw new Error(`Invalid Part ID format: ${vehicleModel}`);
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
            ];
        }

        if (brand) {
            filter.brand = { $regex: brand, $options: "i" };
        }

        if (vehicleModel) {
            filter.compatible_model_ids = { $in: [vehicleModel] };
        }

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        try {
            const parts = await Part.find(filter)
                .populate("compatible_model_ids", "name brand year")
                .populate("media", "url kind publicId")
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await Part.countDocuments(filter);

            return {
                parts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to fetch parts for client: ${error.message}`);
        }
    }

    async getPartByIdByClient(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid Part ID format: ${id}`);
        }

        try {

            const part = await Part.findOne({ _id: id, status: "active" })
                .populate("compatible_model_ids", "name brand year")
                .populate("media", "url kind publicId");

            if (!part) {
                throw new Error("Part not found or is not currently active");
            }

            return part;
        } catch (error) {
            throw new Error(`Failed to fetch part for client: ${error.message}`);
        }
    }
}


module.exports = new PartService();
