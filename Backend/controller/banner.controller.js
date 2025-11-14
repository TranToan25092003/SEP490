const bannerService = require("../service/banner.service");

class BannerController {
    async getActiveBanners(req, res) {
        try {
            const banners = await bannerService.getActiveBanners();
            res.status(200).json({
                success: true,
                data: banners,
            });
        } catch (error) {
            console.error("Error fetching active banners:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new BannerController();