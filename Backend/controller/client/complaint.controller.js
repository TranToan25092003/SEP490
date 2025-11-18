const complaintService = require("../../service/client/complaint.service");

class ComplaintController {
    async createComplaint(req, res) {
    try {

        if(req.userId !== req.body.clerkId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized user!",
            });
        }

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

    async getMyComplaints(req, res, next) {
        try {
            const complaints = await complaintService.getComplaintsByUser(req.userId);
            res.status(200).json({
                success: true,
                data: complaints,
            });
        } catch (error) {
            next(error);
        }
    }

    async getComplaintDetail(req, res, next) {
        try {
            const complaint = await complaintService.getComplaintDetailForUser(
                req.params.id,
                req.userId
            );
            res.status(200).json({
                success: true,
                data: complaint,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ComplaintController();