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
}

module.exports = new ComplaintController();