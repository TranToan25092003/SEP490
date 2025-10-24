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
}

module.exports = new ComplaintController();