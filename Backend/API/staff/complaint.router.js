const express = require("express");
const complaintController = require("../../controller/staff/complaint.controller");

const router = new express.Router();

router.get("/", complaintController.getAllComplaints);
router.get("/:id", complaintController.getComplaintById);
router.patch("/:id/reply", complaintController.addReplyToComplaint);
router.delete("/bulk-delete", complaintController.bulkDeleteComplaints);
router.delete("/:id", complaintController.deleteComplaint);



module.exports = router;