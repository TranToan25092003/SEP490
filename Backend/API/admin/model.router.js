const express = require("express");
const router = express.Router();
const modelController = require("../../controller/admin/model.controller"); 
// const { adminOnly } = require("../../middleware/guards/admin.middleware");

router.post("/", modelController.createModel);
router.get("/", modelController.getAllModels);
router.get("/:id", modelController.getModelById);
router.patch("/:id", modelController.updateModel);
router.delete("/:id", modelController.deleteModel);

module.exports = router;