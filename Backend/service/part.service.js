const { Part, ModelVehicle, MediaAsset } = require("../model");

class PartService {
  async getAllParts(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      brand = "",
      vehicleModel = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};

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
      throw new Error(`Failed to fetch parts: ${error.message}`);
    }
  }

  async getPartById(id) {
    try {
      const part = await Part.findById(id)
        .populate("compatible_model_ids", "name brand year")
        .populate("media", "url kind publicId");

      if (!part) {
        throw new Error("Part not found");
      }

      return part;
    } catch (error) {
      throw new Error(`Failed to fetch part: ${error.message}`);
    }
  }

  async createPart(partData) {
    try {
      if (!partData.name || !partData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!partData.sellingPrice || partData.sellingPrice <= 0) {
        throw new Error("Selling price must be greater than 0");
      }
      if (!partData.costPrice || partData.costPrice <= 0) {
        throw new Error("Cost price must be greater than 0");
      }

      if (!partData.code) {
        partData.code = `PART-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`;
      }

      if (partData.media && partData.media.length > 0) {
        const mediaAssets = await MediaAsset.insertMany(partData.media);
        partData.media = mediaAssets.map((asset) => asset._id);
      }

      const part = new Part(partData);
      await part.save();

      return await this.getPartById(part._id);
    } catch (error) {
      throw new Error(`Failed to create part: ${error.message}`);
    }
  }

  async updatePart(id, updateData) {
    try {
      if (updateData.media && updateData.media.length > 0) {
        const mediaAssets = await MediaAsset.insertMany(updateData.media);
        updateData.media = mediaAssets.map((asset) => asset._id);
      }

      const part = await Part.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("compatible_model_ids", "name brand year")
        .populate("media", "url kind publicId");

      if (!part) {
        throw new Error("Part not found");
      }

      return part;
    } catch (error) {
      throw new Error(`Failed to update part: ${error.message}`);
    }
  }

  async deletePart(id) {
    try {
      console.log("=== DELETE DEBUG ===");
      console.log("Deleting part with ID:", id);
      console.log("ID type:", typeof id);

      const part = await Part.findByIdAndDelete(id);
      console.log("Found part:", part);

      if (!part) {
        throw new Error("Part not found");
      }

      if (part.media && part.media.length > 0) {
        await MediaAsset.deleteMany({ _id: { $in: part.media } });
      }

      console.log("Part deleted successfully");
      console.log("===================");
      return { message: "Part deleted successfully" };
    } catch (error) {
      console.error("Delete error:", error);
      throw new Error(`Failed to delete part: ${error.message}`);
    }
  }

  async getAllVehicleModels() {
    try {
      const models = await ModelVehicle.find().sort({ brand: 1, name: 1 });
      return models;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle models: ${error.message}`);
    }
  }

  async getPartsByVehicleModel(modelId, query = {}) {
    const { page = 1, limit = 10 } = query;

    try {
      const parts = await Part.find({ compatible_model_ids: modelId })
        .populate("compatible_model_ids", "name brand year")
        .populate("media", "url kind publicId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Part.countDocuments({
        compatible_model_ids: modelId,
      });

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
      throw new Error(
        `Failed to fetch parts by vehicle model: ${error.message}`
      );
    }
  }

  async getPartsByBrand(brand, query = {}) {
    const { page = 1, limit = 10 } = query;

    try {
      const parts = await Part.find({ brand: { $regex: brand, $options: "i" } })
        .populate("compatible_model_ids", "name brand year")
        .populate("media", "url kind publicId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Part.countDocuments({
        brand: { $regex: brand, $options: "i" },
      });

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
      throw new Error(`Failed to fetch parts by brand: ${error.message}`);
    }
  }

  async bulkDeleteParts(partIds) {
    try {
      const result = await Part.deleteMany({ _id: { $in: partIds } });

      await MediaAsset.deleteMany({ _id: { $in: partIds } });

      return {
        message: `${result.deletedCount} parts deleted successfully`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw new Error(`Failed to bulk delete parts: ${error.message}`);
    }
  }

  async searchParts(query, limit = 10) {
    try {
      const parts = await Part.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { code: { $regex: query, $options: "i" } },
        ],
        status: "active",
      })
        .select("_id name code brand quantity sellingPrice costPrice")
        .limit(parseInt(limit))
        .sort({ name: 1 });

      return parts;
    } catch (error) {
      throw new Error(`Failed to search parts: ${error.message}`);
    }
  }
}

module.exports = new PartService();
