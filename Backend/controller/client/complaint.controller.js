const complaintService = require("../../service/client/complaint.service");

class ComplaintController {
    async createComplaint(req, res) {
    try {
        const newComplaint = await complaintService.createComplaint(req.body);

         res.status(201).json({
            success: true,
            message: "Complaint created successfully.",
            data: newComplaint,
        });

    } catch (error) {
       
        console.error("Error in createComplaint controller:", error);
        let statusCode = 500;
        if (error.message.includes("not found") || error.message.includes("not authorized")) {
            statusCode = 404; 
        } else if (error.message.includes("Missing required fields")) {
            statusCode = 400; 
        }
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to create complaint.",
        });
    }
}
}

module.exports = new ComplaintController();