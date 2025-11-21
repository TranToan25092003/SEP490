const { ComplaintCategory, Complain } = require("../model");
const DomainError = require("../errors/domainError");

class ComplaintCategoryService {
  async list({ includeInactive = false } = {}) {
    const filter = includeInactive ? {} : { isActive: true };
    return ComplaintCategory.find(filter).sort({ createdAt: 1 }).lean();
  }

  async create({ name, description, userId }) {
    if (!name) {
      throw new DomainError("Category name is required", "COMPLAINT_CATEGORY_NAME_REQUIRED", 400);
    }

    const existing = await ComplaintCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    }).lean();

    if (existing) {
      throw new DomainError("Category name already exists", "COMPLAINT_CATEGORY_EXISTS", 409);
    }

    const category = new ComplaintCategory({
      name: name.trim(),
      description,
      createdBy: userId,
      updatedBy: userId,
    });

    return category.save();
  }

  async update(id, { name, description, isActive, userId }) {
    const category = await ComplaintCategory.findById(id).exec();
    if (!category) {
      throw new DomainError("Category not found", "COMPLAINT_CATEGORY_NOT_FOUND", 404);
    }

    if (name && name.trim() !== category.name) {
      const duplicate = await ComplaintCategory.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name}$`, "i") },
      }).lean();
      if (duplicate) {
        throw new DomainError("Category name already exists", "COMPLAINT_CATEGORY_EXISTS", 409);
      }
      category.name = name.trim();
    }

    if (typeof description !== "undefined") {
      category.description = description;
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    category.updatedBy = userId || category.updatedBy;

    return category.save();
  }

  async remove(id) {
    const referencedCount = await Complain.countDocuments({ category: id }).exec();
    if (referencedCount > 0) {
      throw new DomainError(
        "Cannot delete category that is in use by complaints",
        "COMPLAINT_CATEGORY_IN_USE",
        400
      );
    }

    const deleted = await ComplaintCategory.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new DomainError("Category not found", "COMPLAINT_CATEGORY_NOT_FOUND", 404);
    }
    return deleted;
  }
}

module.exports = new ComplaintCategoryService();

