const { clerkClient } = require("../../config/clerk");
const { Complain, ServiceOrder, Booking, Vehicle, ModelVehicle, Model } = require("../../model");

class ComplaintService {
    async getAllComplaints(query = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "",
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
                    const clerkUsersResult = await clerkClient.users.getUserList({ userId: ["user_34TCUNQspbdhExUc1J8MB1gjnJV"] });
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
                    select: 'createdAt staff_id vehicle_id', // Select necessary fields from ServiceOrder
                    populate: {
                        path: 'vehicle_id',
                        select: 'license_plate model_id', // Select necessary fields from Vehicle
                        populate: {
                            path: 'model_id',
                            select: 'name' // Select only name from Model
                        }
                    }
                })
                .lean();

            if (!complaint) {
                return null;
            }

            // --- Fetch Clerk User Data for the customer ---
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
            if (complaint.so_id && complaint.so_id.staff_id && complaint.so_id.staff_id.length > 0) {
                try {
                    const staffUsersResult = await clerkClient.users.getUserList({ userId: complaint.so_id.staff_id });
                    staffNames = staffUsersResult.data.map(user =>
                        user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "Staff N/A"
                    );
                } catch (clerkError) {
                    console.error(`Failed to fetch staff Clerk data:`, clerkError);
                    staffNames = complaint.so_id.staff_id.map(id => `Staff ID: ${id.slice(-4)}`);
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
                createdAt: complaint.createdAt, 
                so_id: complaint.so_id?._id || null, 
                serviceDate: complaint.so_id?.createdAt || null, 
                license_plate: complaint.so_id?.vehicle_id?.license_plate || 'N/A',
                model: complaint.so_id?.vehicle_id?.model_id?.name || 'N/A',
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
}

module.exports = new ComplaintService();