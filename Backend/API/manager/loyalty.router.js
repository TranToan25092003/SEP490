const express = require("express");
const router = express.Router();
const controller = require("../../controller/manager/loyalty.controller");

router.get("/overview", controller.getOverview);
router.get("/transactions", controller.getTransactions);
router.get("/catalog", controller.getCatalog);

module.exports = router;
