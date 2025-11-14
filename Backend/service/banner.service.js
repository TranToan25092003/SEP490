const { Banner } = require("../model"); // Đảm bảo đường dẫn đến model của bạn là chính xác

class BannerService {
  async getActiveBanners() {
    try {
      const banners = await Banner.find({ is_active: true })
        .sort({ display_order: "asc" })
        .lean();
      return banners;
    } catch (error) {
      throw new Error(`Failed to fetch active banners: ${error.message}`);
    }
  }
}

module.exports = new BannerService();