const { ServiceOrder, Complain, ComplaintCategory } = require("../../model");
const notificationService = require("../notification.service");
const DomainError = require("../../errors/domainError");
const mongoose = require("mongoose");
const { Types } = mongoose;

class ComplaintService {
  async createComplaint(complaintData) {
    const {
      so_id,
      clerkId,
      title,
      content,
      photos,
      rating,
      categoryId,
      categoryName,
    } = complaintData;

    if (!so_id || !clerkId || !title || !content || !categoryId) {
      throw new Error(
        "Missing required fields: so_id, clerkId, title, content, categoryId."
      );
    }

    if (!Types.ObjectId.isValid(so_id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Service Order ID (so_id) format: ${so_id}`,
      });
    }
    if (!Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Complaint Category ID format: ${category}`,
      });
    }

    try {
      const category = await ComplaintCategory.findOne({
        _id: categoryId,
        isActive: true,
      }).exec();

      if (!category) {
        throw new Error("Complaint category not found or inactive.");
      }

      const serviceOrder = await ServiceOrder.findById(so_id).populate({
        path: "booking_id",
        select: "customer_clerk_id",
      });

      if (!serviceOrder) {
        throw new Error(`Service Order with ID ${so_id} not found.`);
      }

      if (serviceOrder.booking_id.customer_clerk_id !== clerkId) {
        throw new Error(
          `User ${clerkId} is not authorized to complain about Service Order ${so_id}.`
        );
      }

      const newComplaint = new Complain({
        so_id,
        clerkId,
        category: category._id,
        categoryName: categoryName || category.name,
        title,
        content,
        photos: photos || [],
        rating,
        status: "pending",
      });

      const savedComplaint = await newComplaint.save();

      notificationService
        .notifyAllStaffOfNewComplaint(savedComplaint)
        .catch((err) => {
          console.error(
            "Failed to send staff notification (non-critical):",
            err.message
          );
        });

      notificationService
        .notifyCustomerComplaintSubmitted(savedComplaint)
        .catch((err) =>
          console.error(
            "Failed to send customer complaint notification:",
            err.message
          )
        );

      return savedComplaint;
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw new Error(`Failed to create complaint: ${error.message}`);
    }
  }

  async getComplaintsByUser(clerkId) {
    const complaints = await Complain.find({ clerkId })
      .sort({ createdAt: -1 })
      .lean();

    return complaints.map(this._mapComplaintForUser);
  }

  async getComplaintDetailForUser(complaintId, clerkId) {
    const complaint = await Complain.findOne({
      _id: complaintId,
      clerkId,
    }).lean();

    if (!complaint) {
      throw new DomainError(
        "Không tìm thấy khiếu nại",
        "COMPLAINT_NOT_FOUND",
        404
      );
    }

    return this._mapComplaintForUser(complaint);
  }

  _mapComplaintForUser(complaint) {
    return {
      id: complaint._id,
      title: complaint.title,
      content: complaint.content,
      status: complaint.status,
      categoryName: complaint.categoryName || "Khác",
      createdAt: complaint.createdAt,
      soId: complaint.so_id,
      photos: complaint.photos || [],
      rating: complaint.rating || null,
      reply:
        complaint.reply && complaint.reply.content
          ? {
            content: complaint.reply.content,
            repliedAt: complaint.reply.repliedAt,
          }
          : null,
    };
  }
}

module.exports = new ComplaintService();
