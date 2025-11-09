const { clerkClient } = require("../../config/clerk");
const { Complain, ServiceOrder, Booking, Vehicle, ModelVehicle, Model } = require("../../model");

const USER_ID_TO_UPDATE = "user_34TCUNQspbdhExUc1J8MB1gjnJV";
const NEW_METADATA = {
  role: "staff",
  // Bạn có thể thêm các metadata khác ở đây nếu muốn
};

class ComplaintService {
    async getAllComplaints(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "",
            category = "",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = query;

        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },

            ];
        }

        if (status && ["pending", "resolved", "rejected"].includes(status)) {
            filter.status = status;
        }

        if (category) {
            filter.category = category;
        }

        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        try {
            const complaints = await Complain.find(filter)
                .select('-__v')
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();

            const total = await Complain.countDocuments(filter);

            const clerkIds = complaints.map(c => c.clerkId).filter(id => id);
            let clerkUserMap = {};
            if (clerkIds.length > 0) {
                try {
                    const clerkUsersResult = await clerkClient.users.getUserList({ userId: clerkIds });
                    console.log(clerkUsersResult.data)
                    for (const user of clerkUsersResult.data) {
                        clerkUserMap[user.id] = {
                            fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "N/A",
                            phoneNumbers: (user.phoneNumbers || []).map(pn => pn.phoneNumber)
                        };
                    }
                } catch (clerkError) {
                    console.error("Failed to fetch Clerk user data:", clerkError);
                }
            }


            const populatedComplaints = complaints.map(complaint => {

                const clerkInfo = clerkUserMap[complaint.clerkId] || { fullName: "Không rõ", phoneNumbers: [] };
                const primaryPhoneNumber = clerkInfo.phoneNumbers.length > 0 ? clerkInfo.phoneNumbers[0] : "N/A";

                return {
                    ...complaint,
                    customerName: clerkInfo.fullName,
                    customerPhone: primaryPhoneNumber,
                };
            });

            return {
                complaints: populatedComplaints,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to fetch complaints: ${error.message}`);
        }
    }

    async getComplaintById(complaintId) {
        try {
            const complaint = await Complain.findById(complaintId)
                .populate({
                    path: 'so_id', 
                    select: 'createdAt staff_clerk_id booking_id', 
                    populate: {
                        path: 'booking_id', 
                        select: 'vehicle_id customer_clerk_id', 
                        populate: {
                            path: 'vehicle_id', 
                            select: 'license_plate model_id',
                            populate: {
                                path: 'model_id',
                                model: 'ModelVehicle', 
                                select: 'name'
                            }
                        }
                    }
                })
                .lean();

            if (!complaint) {
                return null;
            }

            let customerInfo = { fullName: "Không rõ", phoneNumbers: [] };
            if (complaint.clerkId) {
                try {
                    const user = await clerkClient.users.getUser(complaint.clerkId);

                    customerInfo = {
                        fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "N/A",
                        phoneNumbers: (user.phoneNumbers || []).map(pn => pn.phoneNumber)
                    };
                } catch (clerkError) {
                    if (clerkError.status === 404) {
                        console.warn(`Clerk user with ID ${complaint.clerkId} not found.`);
                    } else {
                        console.error(`Failed to fetch Clerk user data for ID ${complaint.clerkId}:`, clerkError);
                    }
                }
            }

            let staffNames = [];
           
            if (complaint.so_id && complaint.so_id.staff_clerk_id) {
                try {
                    const staffUser = await clerkClient.users.getUser(complaint.so_id.staff_clerk_id);
                    staffNames = [ 
                        staffUser.firstName
                            ? `${staffUser.firstName} ${staffUser.lastName || ''}`.trim()
                            : staffUser.username || "Staff N/A"
                    ];
                } catch (clerkError) {
                    console.error(`Failed to fetch staff Clerk data:`, clerkError);
                    staffNames = [`Staff ID: ${complaint.so_id.staff_clerk_id.slice(-4)}`];
                }
            }

            let populatedReply = complaint.reply;
            if (complaint.reply && complaint.reply.staffClerkId) {
                try {
                    const staffUser = await clerkClient.users.getUser(complaint.reply.staffClerkId);
                    const staffFullName = staffUser.firstName
                        ? `${staffUser.firstName} ${staffUser.lastName || ''}`.trim()
                        : staffUser.username || "Staff N/A";

                    populatedReply = {
                        ...complaint.reply,
                        staffFullName: staffFullName
                    };
                } catch (clerkError) {
                    console.error(`Failed to fetch replying staff name for ID ${complaint.reply.staffClerkId}:`, clerkError);
                    populatedReply = {
                        ...complaint.reply,
                        staffFullName: "Staff (Không tìm thấy)"
                    };
                }
            }

            const primaryPhoneNumber = customerInfo.phoneNumbers.length > 0 ? customerInfo.phoneNumbers[0] : "N/A";

            const detailedComplaint = {
                _id: complaint._id,
                title: complaint.title,
                content: complaint.content,
                photos: complaint.photos,
                rating: complaint.rating,
                status: complaint.status,
                category: complaint.category,
                reply: populatedReply,
                createdAt: complaint.createdAt,
                so_id: complaint.so_id?._id || null,
                serviceDate: complaint.so_id?.createdAt || null,
                license_plate: complaint.so_id?.booking_id?.vehicle_id?.license_plate || 'N/A',
                model: complaint.so_id?.booking_id?.vehicle_id?.model_id?.name || 'N/A',
                customerName: customerInfo.fullName,
                customerPhone: primaryPhoneNumber,
                staffNames: staffNames,
            };

            return detailedComplaint;

        } catch (error) {
            console.error("Detailed error fetching complaint:", error);
            throw new Error(`Failed to fetch complaint details: ${error.message}`);
        }
    }

    async addReplyToComplaint(complaintId, staffClerkId, content) {
        try {
            const complaint = await Complain.findById(complaintId);

            if (!complaint) {
                throw new Error("Complaint not found.");
            }

            if (complaint.reply && complaint.reply.content) {
                throw new Error("This complaint has already been replied to.");
            }

            if (!content) {
                throw new Error("Reply content is required.");
            }

            // Cập nhật phản hồi và trạng thái
            complaint.reply = {
                staffClerkId: staffClerkId,
                content: content,
                repliedAt: new Date(),
            };
            complaint.status = "resolved";

            const updatedComplaint = await complaint.save();
            return updatedComplaint;

        } catch (error) {
            throw new Error(`Failed to add reply: ${error.message}`);
        }
    }

    async deleteComplaint(complaintId) {
        if (!complaintId) {
            throw new Error("Complaint ID is required.");
        }

        try {
            const deletedComplaint = await Complain.findByIdAndDelete(complaintId);

            if (!deletedComplaint) {
                throw new Error("Complaint not found.");
            }
            return deletedComplaint;

        } catch (error) {
            console.error("Error deleting complaint:", error);
            throw new Error(`Failed to delete complaint: ${error.message}`);
        }
    }

    async bulkDeleteComplaints(complaintIds) {
        if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
            throw new Error("An array of complaint IDs is required.");
        }

        try {
            const result = await Complain.deleteMany({
                _id: { $in: complaintIds }
            });

            if (result.deletedCount === 0) {
                console.warn("Bulk delete operation completed, but no complaints were found or deleted.");
            }

            return result;

        } catch (error) {
            console.error("Error bulk deleting complaints:", error);
            throw new Error(`Failed to bulk delete complaints: ${error.message}`);
        }
    }
}

module.exports = new ComplaintService();