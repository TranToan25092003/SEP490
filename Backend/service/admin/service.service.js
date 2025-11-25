const { Service, Booking } = require("../../model");
const mongoose = require("mongoose")

class ServiceService {

    async createService(serviceData) {
        const { name, base_price, estimated_time } = serviceData;

        if (!name || !base_price || !estimated_time) {
            throw new Error(
                "Missing required fields: name, base_price, and estimated_time are required."
            );
        }

        try {
            const newService = new Service(serviceData);
            const savedService = await newService.save();
            return savedService;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error("A service with this name already exists.");
            }
            throw new Error(`Failed to create service: ${error.message}`);
        }
    }

    async getAllServices(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // Xây dựng đối tượng sort
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        try {
            const services = await Service.find(filter)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();

            const total = await Service.countDocuments(filter);

            return {
                services,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to fetch services: ${error.message}`);
        }
    }

    async getServiceById(serviceId) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            throw new Error(`Invalid Service ID format: ${serviceId}`);
        }

        try {
            const service = await Service.findById(serviceId).lean();
            if (!service) {
                return null;
            }
            return service;
        } catch (error) {
            throw new Error(`Failed to fetch service by ID: ${error.message}`);
        }
    }

    async updateService(serviceId, updateData) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            throw new Error(`Invalid Service ID format: ${serviceId}`);
        }

        try {
            const updatedService = await Service.findByIdAndUpdate(
                serviceId,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();

            if (!updatedService) {
                return null;
            }
            return updatedService;
        } catch (error) {
            throw new Error(`Failed to update service: ${error.message}`);
        }
    }

    async deleteService(serviceId) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            throw new Error(`Invalid Service ID format: ${serviceId}`);
        }

        try {
            const bookingCount = await Booking.countDocuments({ service_ids: serviceId });

            if (bookingCount > 0) {
                throw new Error(
                    `Cannot delete service. It is currently used in ${bookingCount} booking(s).`
                );
            }

            const deletedService = await Service.findByIdAndDelete(serviceId);

            if (!deletedService) {
                return null;
            }
            return deletedService;
        } catch (error) {
            throw new Error(error.message); 
        }
    }
}

module.exports = new ServiceService();