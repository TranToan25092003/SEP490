const express = require("express");
const partController = require("../../controller/part.controller");
const router = new express.Router();

router.get("/", partController.getAllParts);
router.get("/:id", partController.getPartById);

module.exports = router;