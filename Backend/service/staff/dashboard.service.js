const { ServiceOrder, Booking, Invoice, Part, Vehicle, ModelVehicle } = require("../../model");
const { clerkClient } = require("../../config/clerk");

const monthNames = [
    null, // Index 0 không dùng
    "T1", "T2", "T3", "T4", "T5", "T6",
    "T7", "T8", "T9", "T10", "T11", "T12"
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
                pendingOrdersData
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

                // Lấy các lệnh đang cần xử lý (không phải completed và cancelled)
                ServiceOrder.find({
                    status: { $nin: ["completed", "cancelled"] }
                })
                .populate("booking_id", "customer_clerk_id license_plate")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
                .exec()
            ]);

            // --- Xử lý dữ liệu Lệnh Đang Cần Xử Lý ---
            let pendingOrders = [];

            if (pendingOrdersData && pendingOrdersData.length > 0) {
                try {
                    // Lấy thông tin khách hàng từ Clerk
                    const customerClerkIds = pendingOrdersData
                        .map(order => {
                            if (order.booking_id && order.booking_id.customer_clerk_id) {
                                return order.booking_id.customer_clerk_id;
                            }
                            return null;
                        })
                        .filter(id => id);

                    const clerkUserMap = {};
                    if (customerClerkIds.length > 0) {
                        const clerkUsers = await clerkClient.users.getUserList({ userId: customerClerkIds });
                        for (const user of clerkUsers.data) {
                            clerkUserMap[user.id] = {
                                fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "N/A",
                                phone: (user.phoneNumbers || []).length > 0 ? user.phoneNumbers[0].phoneNumber : "N/A"
                            };
                        }
                    }

                    // Map dữ liệu lệnh với thông tin từ Clerk và Booking
                    pendingOrders = pendingOrdersData.map(order => {
                        const customerClerkId = order.booking_id?.customer_clerk_id;
                        const customerInfo = customerClerkId ? clerkUserMap[customerClerkId] : null;
                        
                        return {
                            id: order._id.toString(),
                            orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
                            licensePlate: order.booking_id?.license_plate || order.walk_in_vehicle?.license_plate || "N/A",
                            customerName: customerInfo?.fullName || order.walk_in_customer?.name || "N/A",
                            status: order.status,
                            createdAt: order.createdAt,
                            phone: customerInfo?.phone || order.walk_in_customer?.phone || "N/A"
                        };
                    });

                } catch (clerkError) {
                    console.error("Failed to fetch Clerk data for pending orders:", clerkError);
                    // Trả về dữ liệu thô nếu không lấy được thông tin Clerk
                    pendingOrders = pendingOrdersData.map(order => ({
                        id: order._id.toString(),
                        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
                        licensePlate: order.booking_id?.license_plate || order.walk_in_vehicle?.license_plate || "N/A",
                        customerName: order.walk_in_customer?.name || "N/A",
                        status: order.status,
                        createdAt: order.createdAt,
                        phone: order.walk_in_customer?.phone || "N/A"
                    }));
                }
            }

            // --- Tổng hợp kết quả ---
            const stats = {
                orders: orderCount || 0,
                requests: requestCount || 0,
                revenue: totalRevenueResult[0]?.totalRevenue || 0,
                customers: customerCountResult?.length || 0,
            };

            // Đảm bảo lineChartData và barChartData có đủ 12 tháng gần nhất
            const now = new Date();
            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `T${date.getMonth() + 1}`;
                last12Months.push(monthKey);
            }

            // Fill lineChartData với đầy đủ 12 tháng
            const lineChartMap = {};
            lineChartData.forEach(item => {
                lineChartMap[item.name] = item.YêuCầu;
            });
            const filledLineChartData = last12Months.map(month => ({
                name: month,
                YêuCầu: lineChartMap[month] || 0
            }));

            // Fill barChartData với đầy đủ 12 tháng
            const barChartMap = {};
            barChartData.forEach(item => {
                barChartMap[item.month] = item.DoanhThu;
            });
            const filledBarChartData = last12Months.map(month => ({
                month: month,
                DoanhThu: barChartMap[month] || 0
            }));

            return {
                stats,
                lineChartData: filledLineChartData,
                barChartData: filledBarChartData,
                pieChartData: pieChartData || [],
                pendingOrders: pendingOrders || []
            };

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw new Error(`Failed to fetch dashboard data: ${error.message}`);
        }
    }
}

module.exports = new DashboardService();