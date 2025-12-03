const express = require("express");
const bayController = require("../../controller/staff/bay.controller");

const router = new express.Router();

// List bays with basic pagination and search
router.get("/", bayController.listBays);

// Real-time availability snapshot
router.get("/availability/snapshot", bayController.availability);

// Create bay
router.post("/", bayController.createBay);

// Update bay
router.put("/:id", bayController.updateBay);

// Delete bay
router.delete("/:id", bayController.deleteBay);

module.exports = router;
