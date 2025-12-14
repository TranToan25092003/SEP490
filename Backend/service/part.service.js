const { Part, ModelVehicle, MediaAsset } = require("../model");
const mongoose = require("mongoose");

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
      statusFilter = "",
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

    // Filter by status and stock availability
    if (statusFilter) {
      switch (statusFilter) {
        case "available":
          // Có sẵn: active và quantity > 0
          filter.status = "active";
          filter.quantity = { $gt: 0 };
          break;
        case "out_of_stock":
          // Hết hàng: active và quantity = 0
          filter.status = "active";
          filter.quantity = 0;
          break;
        case "inactive":
          // Bị vô hiệu hóa: inactive
          filter.status = "inactive";
          break;
        // "all" or empty: no additional filter
      }
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

      // Handle compatible_model_ids: remove duplicates and ensure valid ObjectIds
      if (partData.compatible_model_ids !== undefined) {
        if (Array.isArray(partData.compatible_model_ids)) {
          // Remove duplicates and filter out invalid values
          const uniqueIds = Array.from(
            new Set(
              partData.compatible_model_ids
                .map((id) => {
                  // Convert to string and validate ObjectId format
                  const idStr = String(id).trim();
                  if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
                    return new mongoose.Types.ObjectId(idStr);
                  }
                  return null;
                })
                .filter((id) => id !== null)
            )
          );
          partData.compatible_model_ids = uniqueIds;
        } else {
          // If not an array, set to empty array
          partData.compatible_model_ids = [];
        }
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
      // Get existing part first to preserve code if not provided
      const existingPart = await Part.findById(id);
      if (!existingPart) {
        throw new Error("Part not found");
      }

      // Preserve code if not provided in updateData (to avoid unique constraint error)
      if (!updateData.code && existingPart.code) {
        updateData.code = existingPart.code;
      }

      // Handle media: only create new MediaAssets if they don't have _id (new uploads)
      // If media is not provided or is undefined, keep existing media
      if (updateData.media !== undefined) {
        if (Array.isArray(updateData.media) && updateData.media.length > 0) {
          const newMediaAssets = [];
          const existingMediaIds = [];

          for (const mediaItem of updateData.media) {
            // Check if it's already an ObjectId (from frontend sending existing media IDs)
            if (mongoose.Types.ObjectId.isValid(mediaItem)) {
              existingMediaIds.push(new mongoose.Types.ObjectId(mediaItem));
            }
            // If media item has _id property and it's a valid ObjectId, it's an existing asset
            else if (
              mediaItem._id &&
              mongoose.Types.ObjectId.isValid(mediaItem._id)
            ) {
              existingMediaIds.push(new mongoose.Types.ObjectId(mediaItem._id));
            }
            // If it has publicId or url but no _id, it's a new media asset
            else if (mediaItem.publicId || mediaItem.url) {
              newMediaAssets.push(mediaItem);
            }
          }

          // Create new media assets if any
          let newMediaAssetIds = [];
          if (newMediaAssets.length > 0) {
            const createdAssets = await MediaAsset.insertMany(newMediaAssets);
            newMediaAssetIds = createdAssets.map((asset) => asset._id);
          }

          // Combine existing and new media IDs
          updateData.media = [...existingMediaIds, ...newMediaAssetIds];
        } else if (
          Array.isArray(updateData.media) &&
          updateData.media.length === 0
        ) {
          // Empty array means user wants to clear all media
          updateData.media = [];
        } else {
          // If media is not an array or is null, keep existing media
          delete updateData.media;
        }
      } else {
        // If media is not provided in update, keep existing media
        delete updateData.media;
      }

      // Handle compatible_model_ids: remove duplicates and ensure valid ObjectIds
      let processedCompatibleModelIds = undefined;
      if (updateData.compatible_model_ids !== undefined) {
        if (Array.isArray(updateData.compatible_model_ids)) {
          // First, convert all to strings and validate, then remove duplicates by string comparison
          const validIdStrings = updateData.compatible_model_ids
            .map((id) => {
              const idStr = String(id).trim();
              if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
                return idStr;
              }
              return null;
            })
            .filter((id) => id !== null);

          // Remove duplicates using Set with string comparison
          const uniqueIdStrings = Array.from(new Set(validIdStrings));

          // Convert back to ObjectIds and verify no duplicates after conversion
          const objectIds = uniqueIdStrings.map(
            (idStr) => new mongoose.Types.ObjectId(idStr)
          );

          // Double check for duplicates by comparing ObjectId strings
          const finalUniqueIds = [];
          const seenIds = new Set();
          for (const objId of objectIds) {
            const idStr = String(objId);
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              finalUniqueIds.push(objId);
            }
          }

          processedCompatibleModelIds = finalUniqueIds;

          console.log("Processed compatible_model_ids:", {
            original: updateData.compatible_model_ids.length,
            afterDedup: finalUniqueIds.length,
            ids: finalUniqueIds.map((id) => String(id)),
          });
        } else {
          // If not an array, set to empty array
          processedCompatibleModelIds = [];
        }
        // Remove from updateData to handle separately
        delete updateData.compatible_model_ids;
      }

      // Get the part document first
      const part = await Part.findById(id);
      if (!part) {
        throw new Error("Part not found");
      }

      // Update all fields except compatible_model_ids using updateOne
      const fieldsToUpdate = { ...updateData };
      delete fieldsToUpdate.compatible_model_ids;

      if (Object.keys(fieldsToUpdate).length > 0) {
        await Part.updateOne(
          { _id: id },
          { $set: fieldsToUpdate },
          { runValidators: true }
        );
      }

      // Update compatible_model_ids separately using $set to avoid index conflicts
      if (processedCompatibleModelIds !== undefined) {
        // First, clear the array to avoid any index conflicts
        await Part.updateOne(
          { _id: id },
          { $set: { compatible_model_ids: [] } },
          { runValidators: false }
        );

        // Then set the new array
        await Part.updateOne(
          { _id: id },
          { $set: { compatible_model_ids: processedCompatibleModelIds } },
          { runValidators: true }
        );
      }

      // Fetch updated part with populated fields
      const updatedPart = await Part.findById(id)
        .populate("compatible_model_ids", "name brand year")
        .populate("media", "url kind publicId");

      if (!updatedPart) {
        throw new Error("Part not found");
      }

      return updatedPart;
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
