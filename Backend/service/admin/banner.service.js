const { Banner } = require("../../model");
const mongoose = require("mongoose")

class BannerService {
    async createBanner(bannerData) {
        const { title, image_url, is_active, display_order } = bannerData;

        if (!title || !image_url || !is_active || !display_order) {
            throw new Error(
                "Missing required fields: title, image_url, isActive and display_order are required."
            );
        }

        if (typeof is_active !== 'boolean') {
            throw new Error("Invalid data type: is_active must be a boolean.");
        }

        const orderNumber = Number(display_order);
        if (isNaN(orderNumber) || !Number.isInteger(orderNumber)) {
            throw new Error("Invalid data type: display_order must be an integer.");
        }

        try {
            const newBanner = new Banner({
                ...bannerData,
                display_order: orderNumber
            });
            const savedBanner = await newBanner.save();
            return savedBanner;
        } catch (error) {
            throw new Error(`Failed to create banner: ${error.message}`);
        }
    }

    async getAllBanners(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "display_order", // Sắp xếp theo thứ tự hiển thị
            sortOrder = "asc",
        } = query;

        const filter = {};

        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        try {
            const banners = await Banner.find(filter)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();

            const total = await Banner.countDocuments(filter);

            return {
                banners,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to fetch banners: ${error.message}`);
        }
    }

    async getBannerById(bannerId) {
        if (!mongoose.Types.ObjectId.isValid(bannerId)) {
            throw new Error(`Invalid Banner ID format: ${bannerId}`);
        }

        try {
            const banner = await Banner.findById(bannerId).lean();
            if (!banner) {
                return null;
            }
            return banner;
        } catch (error) {
            throw new Error(`Failed to fetch banner by ID: ${error.message}`);
        }
    }

    async updateBanner(bannerId, updateData) {
        if (updateData.is_active !== undefined && typeof updateData.is_active !== 'boolean') {
            throw new Error("Invalid data type: is_active must be a boolean.");
        }
        if (updateData.display_order !== undefined) {
            const orderNumber = Number(updateData.display_order);
            if (isNaN(orderNumber) || !Number.isInteger(orderNumber)) {
                throw new Error("Invalid data type: display_order must be an integer.");
            }
            updateData.display_order = orderNumber;
        }

        try {
            const updatedBanner = await Banner.findByIdAndUpdate(
                bannerId,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();

            if (!updatedBanner) {
                return null;
            }
            return updatedBanner;
        } catch (error) {
            throw new Error(`Failed to update banner: ${error.message}`);
        }
    }

    async deleteBanner(bannerId) {
        if (!mongoose.Types.ObjectId.isValid(bannerId)) {
            throw new Error(`Invalid Banner ID format: ${bannerId}`);
        }

        try {
            const deletedBanner = await Banner.findByIdAndDelete(bannerId);

            if (!deletedBanner) {
                return null;
            }
            return deletedBanner;
        } catch (error) {
            throw new Error(`Failed to delete banner: ${error.message}`);
        }
    }
}

module.exports = new BannerService();