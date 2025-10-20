const { Part } = require("../../model");

class PartService {
    //Get all parts for client
    async getAllPartsByClient(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            brand = "",
            vehicleModel = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = query;

        const filter = { status: "active" };

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
}

module.exports = new PartService();
