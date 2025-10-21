const { Part, ModelVehicle, MediaAsset } = require("../model");

class PartService {
  // Get all parts with pagination and filtering
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

    // Build filter object
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

    // Build sort object
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

  // Get single part by ID
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

  // Create new part
  async createPart(partData) {
    try {
      // Validate required fields
      if (!partData.name || !partData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!partData.sellingPrice || partData.sellingPrice <= 0) {
        throw new Error("Selling price must be greater than 0");
      }
      if (!partData.costPrice || partData.costPrice <= 0) {
        throw new Error("Cost price must be greater than 0");
      }

      // Generate code if not provided
      if (!partData.code) {
        partData.code = `PART-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`;
      }

      // Create media assets if provided
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

  // Update part
  async updatePart(id, updateData) {
    try {
      // Handle media assets update
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

  // Delete part
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

      // Clean up associated media assets
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

  // Get all vehicle models (replaces categories)
  async getAllVehicleModels() {
    try {
      const models = await ModelVehicle.find().sort({ brand: 1, name: 1 });
      return models;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle models: ${error.message}`);
    }
  }

  // Get parts by vehicle model
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

  // Get parts by brand
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

  // Bulk delete parts
  async bulkDeleteParts(partIds) {
    try {
      const result = await Part.deleteMany({ _id: { $in: partIds } });

      // Clean up associated media assets
      await MediaAsset.deleteMany({ _id: { $in: partIds } });

      return {
        message: `${result.deletedCount} parts deleted successfully`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw new Error(`Failed to bulk delete parts: ${error.message}`);
    }
  }

  // Search parts by name or code
  async searchParts(query, limit = 10) {
    try {
      const parts = await Part.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { code: { $regex: query, $options: "i" } },
        ],
        status: "active", // Only search active parts
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
