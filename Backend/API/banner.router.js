const express = require("express");
const router = new express.Router();
const bannerController = require("../controller/banner.controller");

router.get("/active", bannerController.getActiveBanners);

module.exports = router;