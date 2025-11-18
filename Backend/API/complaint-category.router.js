const express = require("express");
const router = express.Router();
const complaintCategoryController = require("../controller/complaintCategory.controller");

router.get("/", complaintCategoryController.listPublic);

module.exports = router;
