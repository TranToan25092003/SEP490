const { clerkClient } = require("../../config/clerk");
const { Complain, ServiceOrder, Booking, Vehicle, ModelVehicle } = require("../../model");

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
}

module.exports = new ComplaintService();