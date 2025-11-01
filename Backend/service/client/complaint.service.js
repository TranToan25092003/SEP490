const { ServiceOrder, Complain } = require("../../model");

class ComplaintService {
    async createComplaint(complaintData) {
        const { so_id, clerkId, title, content, photos, rating, category } = complaintData;

        if (!so_id || !clerkId || !title || !content || !category) {
            throw new Error("Missing required fields: so_id, clerkId, title, content, category.");
        }

        try {
            const serviceOrder = await ServiceOrder.findById(so_id).populate({
                path: 'booking_id',
                select: 'clerkId'
            });

            if (!serviceOrder) {
                throw new Error(`Service Order with ID ${so_id} not found.`);
            }

            if (serviceOrder.booking_id.clerkId !== clerkId) {
                throw new Error(`User ${clerkId} is not authorized to complain about Service Order ${so_id}.`);
            }

            const newComplaint = new Complain({
                so_id,
                clerkId,
                category,
                title,
                content,
                photos: photos || [],
                rating,
                status: "pending",
            });

            const savedComplaint = await newComplaint.save();

            return savedComplaint;
        } catch (error) {
            console.error("Error creating complaint:", error);
            throw new Error(`Failed to create complaint: ${error.message}`);
        }
    }
}

module.exports = new ComplaintService();