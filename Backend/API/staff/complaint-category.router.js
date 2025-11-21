const express = require("express");
const router = express.Router();
const complaintCategoryController = require("../../controller/complaintCategory.controller");
const { authenticate } = require("../../middleware/guards/authen.middleware");

router.use(authenticate);

router.get("/", complaintCategoryController.listPublic);
router.post("/", complaintCategoryController.create);
router.put("/:id", complaintCategoryController.update);
router.delete("/:id", complaintCategoryController.remove);

module.exports = router;
