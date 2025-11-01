const complaintService = require("../../service/staff/complaint.service");

class ComplaintController {
    async getAllComplaints(req, res) {
        try {

            const result = await complaintService.getAllComplaints(req.query);

            res.status(200).json({
                success: true,
                data: result.complaints,
                pagination: result.pagination,
            });
        } catch (error) {
            // Trả về lỗi nếu có
            console.error("Error fetching complaints:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch complaints.",
            });
        }
    }

    async getComplaintById(req, res) {
        try {
            const complaintId = req.params.id;
            if (!complaintId) {
                return res.status(400).json({ success: false, message: "Complaint ID is required." });
            }

            const complaint = await complaintService.getComplaintById(complaintId);

            if (!complaint) {
                return res.status(404).json({ success: false, message: "Complaint not found." });
            }

            res.status(200).json({ success: true, data: complaint });

        } catch (error) {
            console.error("Error fetching complaint details:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch complaint details.",
            });
        }
    }

    async addReplyToComplaint(req, res) {
        try {
            const complaintId = req.params.id;
            const staffClerkId = req.userId;
            const { content } = req.body;

            if (!staffClerkId) {
                return res.status(401).json({ success: false, message: "Unauthorized: Staff ID not found." });
            }

            if (!content) {
                return res.status(400).json({ success: false, message: "Reply content is required." });
            }

            const updatedComplaint = await complaintService.addReplyToComplaint(complaintId, staffClerkId, content);

            res.status(200).json({
                success: true,
                message: "Reply added successfully.",
                data: updatedComplaint,
            });

        } catch (error) {
            console.error("Error adding reply to complaint:", error);

            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message.includes("already been replied to")) {
                return res.status(409).json({ success: false, message: error.message });
            }

            res.status(500).json({
                success: false,
                message: error.message || "Failed to add reply.",
            });
        }
    }

    async deleteComplaint(req, res) {
        try {
            const complaintId = req.params.id;
            if (!complaintId) {
                return res.status(400).json({ success: false, message: "Complaint ID is required." });
            }

            const deletedComplaint = await complaintService.deleteComplaint(complaintId);

            if (!deletedComplaint) {
                return res.status(404).json({ success: false, message: "Complaint not found." });
            }

            res.status(200).json({
                success: true,
                message: "Complaint deleted successfully.",
                data: deletedComplaint
            });

        } catch (error) {
            console.error("Error deleting complaint:", error);
            if (error.message.includes("not found")) {
                return res.status(404).json({ success: false, message: error.message });
            }
            res.status(500).json({
                success: false,
                message: error.message || "Failed to delete complaint.",
            });
        }
    }

    async bulkDeleteComplaints(req, res) {
        try {
            const { ids } = req.body; 
            console.log(ids)
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "An array of complaint IDs is required."
                });
            }

            const result = await complaintService.bulkDeleteComplaints(ids);

            res.status(200).json({
                success: true,
                message: `${result.deletedCount} complaints deleted successfully.`,
                data: result
            });

        } catch (error) {
            console.error("Error bulk deleting complaints:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to bulk delete complaints.",
            });
        }
    }
}

module.exports = new ComplaintController();