const complaintCategoryService = require("../service/complaint_category.service");

class ComplaintCategoryController {
  async listPublic(req, res, next) {
    try {
      const categories = await complaintCategoryService.list({
        includeInactive: req.query.includeInactive === "true",
      });
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await complaintCategoryService.create({
        name: req.body.name,
        description: req.body.description,
        userId: req.userId,
      });
      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await complaintCategoryService.update(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        isActive: req.body.isActive,
        userId: req.userId,
      });
      res.status(200).json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await complaintCategoryService.remove(req.params.id);
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ComplaintCategoryController();
