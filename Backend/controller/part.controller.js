const partService = require("../service/part.service");

class PartController {
  // Get all parts
  async getAllParts(req, res) {
    try {
      const result = await partService.getAllParts(req.query);

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

  // Get single part
  async getPartById(req, res) {
    try {
      const { id } = req.params;
      const part = await partService.getPartById(id);

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

  // Create new part
  async createPart(req, res) {
    try {
      const part = await partService.createPart(req.body);

      res.status(201).json({
        success: true,
        data: part,
        message: "Part created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update part
  async updatePart(req, res) {
    try {
      const { id } = req.params;
      const part = await partService.updatePart(id, req.body);

      res.status(200).json({
        success: true,
        data: part,
        message: "Part updated successfully",
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete part
  async deletePart(req, res) {
    try {
      const { id } = req.params;
      const result = await partService.deletePart(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all vehicle models (replaces categories)
  async getAllVehicleModels(req, res) {
    try {
      const models = await partService.getAllVehicleModels();

      res.status(200).json({
        success: true,
        data: models,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get parts by vehicle model
  async getPartsByVehicleModel(req, res) {
    try {
      const { modelId } = req.params;
      const result = await partService.getPartsByVehicleModel(
        modelId,
        req.query
      );

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

  // Get parts by brand
  async getPartsByBrand(req, res) {
    try {
      const { brand } = req.params;
      const result = await partService.getPartsByBrand(brand, req.query);

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

  // Bulk delete parts
  async bulkDeleteParts(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Part IDs are required",
        });
      }

      const result = await partService.bulkDeleteParts(ids);

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PartController();
