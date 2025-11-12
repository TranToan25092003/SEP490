const bannerService = require("../../service/admin/banner.service"); 

class BannerController {
    async createBanner(req, res) {
        try {
            const newBanner = await bannerService.createBanner(req.body);
            res.status(201).json({
                success: true,
                data: newBanner,
                message: "Banner created successfully.",
            });
        } catch (error) {
            console.error("Error creating banner:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getAllBanners(req, res) {
        try {
            const result = await bannerService.getAllBanners(req.query);
            res.status(200).json({
                success: true,
                data: result.banners,
                pagination: result.pagination,
            });
        } catch (error) {
            console.error("Error fetching banners:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getBannerById(req, res) {
        try {
            const bannerId = req.params.id;
            const banner = await bannerService.getBannerById(bannerId);

            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: "Banner not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: banner,
            });
        } catch (error) {
            console.error("Error fetching banner by ID:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async updateBanner(req, res) {
        try {
            const bannerId = req.params.id;
            const updateData = req.body;

            const updatedBanner = await bannerService.updateBanner(bannerId, updateData);

            if (!updatedBanner) {
                return res.status(404).json({
                    success: false,
                    message: "Banner not found.",
                });
            }

            res.status(200).json({
                success: true,
                data: updatedBanner,
                message: "Banner updated successfully.",
            });
        } catch (error) {
            console.error("Error updating banner:", error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async deleteBanner(req, res) {
        try {
            const bannerId = req.params.id;
            const deletedBanner = await bannerService.deleteBanner(bannerId);

            if (!deletedBanner) {
                return res.status(404).json({
                    success: false,
                    message: "Banner not found.",
                });
            }

            res.status(200).json({
                success: true,
                message: "Banner deleted successfully.",
                data: deletedBanner,
            });
        } catch (error) {
            console.error("Error deleting banner:", error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = new BannerController();