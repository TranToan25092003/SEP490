const { Bay } = require("../../model");

class BayService {
  async listBays(query = {}) {
    const { page = 1, limit = 10, search = "", status } = query;
    const filter = {};
    if (search) {
      filter.$or = [
        { bay_number: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    const bays = await Bay.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    const total = await Bay.countDocuments(filter);
    return {
      bays,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async createBay(payload) {
    const { bay_number, status = "available", description } = payload;
    if (!bay_number) throw new Error("bay_number is required");
    return await Bay.create({ bay_number, status, description });
  }

  async updateBay(id, payload) {
    const bay = await Bay.findByIdAndUpdate(id, payload, { new: true });
    if (!bay) throw new Error("Bay not found");
    return bay;
  }

  async deleteBay(id) {
    const bay = await Bay.findByIdAndDelete(id);
    if (!bay) throw new Error("Bay not found");
    return true;
  }
}

module.exports = new BayService();

