const express = require("express");
const router = express.Router();
const bannerController = require("../../controller/admin/banner.controller"); 

// const { adminOnly } = require("../../middleware/guards/admin.middleware"); // Bạn nên thêm middleware này để chỉ admin mới có quyền

router.post("/", bannerController.createBanner);
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.patch("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;