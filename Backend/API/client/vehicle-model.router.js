const express = require("express");
const vehicleModelController = require("../../controller/client/vehicle-model.controller");

const router = new express.Router();

router.get("/grouped-by-brand", vehicleModelController.getGroupedModels);


module.exports = router;