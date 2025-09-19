// src/pages/admin/DashboardStats.jsx
import React from "react";
import { useLoaderData } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Activity
} from "lucide-react";

/**
 * ====================================
 * Loader (Để fetch dữ liệu thống kê từ Backend)
 * ====================================
 */
export const dashboardStatsLoader = async () => {
  try {
    const response = await customFetch.get("/admin/stats/dashboard");
    return { data: response.data.data };
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu thống kê:", error);
    return { message: "Không thể tải dữ liệu thống kê.", error: error.message };
  }
};

/**
 * ====================================
 * Component hiển thị Thống kê
 * ====================================
 */
const DashboardStats = () => {
  const { data, message, error } = useLoaderData();

  // Xử lý trường hợp lỗi khi tải dữ liệu
  if (message || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-red-200">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-red-600 text-center mb-4">{message || error}</p>
          <p className="text-gray-500 text-sm text-center">
            Vui lòng kiểm tra lại kết nối mạng hoặc server backend.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 text-center">
            Đang tải thống kê...
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalUsers,
    totalItems,
    totalBuyTransactions,
    totalBorrowTransactions,
    totalRevenue,
    totalBuyRevenue,
    totalBorrowRevenue,
    totalReports,
  } = data;

  // Định nghĩa các card stats với màu sắc và icon đẹp
  const statsCards = [
    {
      title: "Tổng Người Dùng",
      value: totalUsers,
      description: "Tổng số tài khoản đã đăng ký",
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Tổng Vật Phẩm",
      value: totalItems,
      description: "Tổng số vật phẩm trên hệ thống",
      icon: Package,
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Tổng Doanh Thu",
      value: `$${(totalRevenue || 0).toLocaleString()}`,
      description: "Từ tất cả giao dịch mua và mượn",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-400",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Giao Dịch Mua",
      value: totalBuyTransactions,
      description: "Tổng số lượt mua",
      icon: ShoppingBag,
      gradient: "from-orange-500 to-red-400",
      bgGradient: "from-orange-50 to-red-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Giao Dịch Mượn",
      value: totalBorrowTransactions,
      description: "Tổng số lượt mượn",
      icon: BookOpen,
      gradient: "from-indigo-500 to-blue-400",
      bgGradient: "from-indigo-50 to-blue-50",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600"
    },
    {
      title: "Doanh Thu Mua",
      value: `$${(totalBuyRevenue || 0).toLocaleString()}`,
      description: "Tổng doanh thu từ giao dịch mua",
      icon: TrendingUp,
      gradient: "from-teal-500 to-green-400",
      bgGradient: "from-teal-50 to-green-50",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    {
      title: "Doanh Thu Mượn",
      value: `$${(totalBorrowRevenue || 0).toLocaleString()}`,
      description: "Tổng doanh thu từ giao dịch mượn",
      icon: DollarSign,
      gradient: "from-cyan-500 to-blue-400",
      bgGradient: "from-cyan-50 to-blue-50",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600"
    },
    {
      title: "Tổng Báo Cáo",
      value: totalReports,
      description: "Tổng số báo cáo/phản hồi từ người dùng",
      icon: AlertTriangle,
      gradient: "from-yellow-500 to-orange-400",
      bgGradient: "from-yellow-50 to-orange-50",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#1DCD9F] to-[#16B587] p-8 rounded-b-3xl shadow-lg mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            📊 Thống Kê Tổng Quan
          </h1>
          <p className="text-green-100 text-lg">
            Theo dõi hiệu suất và dữ liệu quan trọng của hệ thống
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className={`group relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105`}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-800 transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {stat.description}
                  </p>
                </CardContent>

                {/* Decorative Element */}
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500" />
              </Card>
            );
          })}
        </div>


      </div>
    </div>
  );
};

export default DashboardStats;