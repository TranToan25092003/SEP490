const { ServiceOrder, Booking, Invoice, Part, Vehicle, ModelVehicle } = require("../../model");
const { clerkClient } = require("../../config/clerk");

const monthNames = [
    null, // Index 0 không dùng
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

class DashboardService {
    async getStaffDashboardData(query = {}) {
        const { filterPeriod = "year" } = query; // Ví dụ: 'year', 'month'

        // Lấy ngày bắt đầu của 12 tháng trước
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        try {
            const [
                orderCount,
                requestCount,
                totalRevenueResult,
                customerCountResult,
                lineChartData,
                barChartData,
                pieChartData,
                topCustomerData
            ] = await Promise.all([
                // Đếm tổng số ServiceOrder đã hoàn thành
                ServiceOrder.countDocuments({ status: "completed" }),

                // Đếm các Booking đang chờ hoặc đang diễn ra
                Booking.countDocuments({ status: { $in: ["booked", "checked_in", "in_progress"] } }),

                // Tính tổng tiền từ các Invoice đã thanh toán
                Invoice.aggregate([
                    { $match: { status: "paid" } },
                    { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
                ]),

                // Đếm số lượng khách hàng (customer_clerk_id) duy nhất
                Booking.distinct("customer_clerk_id"),

                // Đếm số lượng Booking theo tháng
                Booking.aggregate([
                    { $match: { createdAt: { $gte: oneYearAgo } } },
                    {
                        $group: {
                            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                    {
                        $project: {
                            _id: 0,
                            name: { $arrayElemAt: [monthNames, "$_id.month"] }, // Chuyển 1 -> "Jan"
                            YêuCầu: "$count"
                        }
                    }
                ]),

                // Tính tổng doanh thu (Invoice) theo tháng
                Invoice.aggregate([
                    { $match: { status: "paid", createdAt: { $gte: oneYearAgo } } },
                    {
                        $group: {
                            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                            totalRevenue: { $sum: "$amount" }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                    {
                        $project: {
                            _id: 0,
                            month: { $arrayElemAt: [monthNames, "$_id.month"] },
                            DoanhThu: "$totalRevenue"
                        }
                    }
                ]),

                // Phân tích các dịch vụ trong ServiceOrder
                ServiceOrder.aggregate([
                    { $match: { status: "completed" } },
                    { $unwind: "$items" }, // Tách mảng items
                    { $match: { "items.item_type": "service" } }, // Chỉ lấy các services
                    {
                        $group: {
                            _id: "$items.name",
                            value: { $sum: 1 } // Đếm số lần thực hiện mỗi dịch vụ
                        }
                    },
                    { $project: { _id: 0, name: "$_id", value: 1 } }
                ]),

                // Top 5 khách hàng chi tiêu nhiều nhất
                Invoice.aggregate([
                    { $match: { status: 'paid' } },
                    {
                        $group: {
                            _id: "$clerkId", // Group theo clerkId của khách hàng (nếu có)
                            spent: { $sum: "$amount" }
                        }
                    },
                    { $sort: { spent: -1 } },
                    { $limit: 5 }
                ])
            ]);

            // --- Xử lý dữ liệu Khách Hàng Tiềm Năng (Gọi Clerk) ---
            const topCustomerClerkIds = topCustomerData.map(c => c._id).filter(id => id);
            let potentialCustomers = [];

            if (topCustomerClerkIds.length > 0) {
                try {
                    const clerkUsers = await clerkClient.users.getUserList({ userId: topCustomerClerkIds });
                    const clerkUserMap = {};

                    for (const user of clerkUsers.data) {
                        clerkUserMap[user.id] = {
                            fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "N/A",
                            phone: (user.phoneNumbers || []).length > 0 ? user.phoneNumbers[0].phoneNumber : "N/A"
                        };
                    }

                    // Map dữ liệu chi tiêu với thông tin từ Clerk
                    potentialCustomers = topCustomerData.map(customer => ({
                        id: `#${customer._id.slice(-6)}`,
                        name: clerkUserMap[customer._id]?.fullName || "Không rõ",
                        spent: customer.spent,
                        phone: clerkUserMap[customer._id]?.phone || "N/A"
                    }));

                } catch (clerkError) {
                    console.error("Failed to fetch Clerk data for top customers:", clerkError);
                    // Trả về dữ liệu thô nếu không lấy được thông tin Clerk
                    potentialCustomers = topCustomerData.map(customer => ({
                        id: `#${customer._id.slice(-6)}`,
                        name: "Không rõ",
                        spent: customer.spent,
                        phone: "N/A"
                    }));
                }
            }

            // --- Tổng hợp kết quả ---
            const stats = {
                orders: orderCount,
                requests: requestCount,
                revenue: totalRevenueResult[0]?.totalRevenue || 0,
                customers: customerCountResult.length,
            };

            return {
                stats,
                lineChartData,
                barChartData,
                pieChartData,
                potentialCustomers
            };

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw new Error(`Failed to fetch dashboard data: ${error.message}`);
        }
    }
}

module.exports = new DashboardService();