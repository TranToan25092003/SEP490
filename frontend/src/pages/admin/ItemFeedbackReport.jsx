import React, { useState } from "react";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationDemo } from "@/components/global/PaginationComp";
import { Search, Calendar, User, Package, Star, Trash2, Eye, Filter, RefreshCw, MessageSquare, TrendingUp, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const itemFeedbackReportLoader = async ({ request }) => {
  const params = Object.fromEntries([
    ...new URL(request.url).searchParams.entries(),
  ]);

  params.limit = params.limit || 6;

  try {
    const response = await customFetch.get("/admin/reports/item-feedback-reports", { params });
    return {
      reports: response.data.transactions,
      searchParams: params,
    };
  } catch (error) {
    toast.error("Lỗi khi tải báo cáo phản hồi sản phẩm");
    console.error("Loader Error:", error);
    return {
      reports: { data: [], totalItems: 0, totalPages: 0, currentPage: 1 },
      searchParams: params,
      error: "Không thể tải dữ liệu báo cáo phản hồi sản phẩm.",
    };
  }
};

const ItemFeedbackReport = () => {
  const { reports, searchParams } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentReport, setCurrentReport] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParams = Object.fromEntries(formData.entries());
    newParams.page = 1;

    const search = new URLSearchParams(newParams).toString();
    navigate(`${location.pathname}?${search}`);
  };

  const handlePageChange = (page) => {
    const currentParams = new URLSearchParams(location.search);
    currentParams.set("page", page);
    navigate(`${location.pathname}?${currentParams.toString()}`);
  };

  const handleViewDetails = (report) => {
    setCurrentReport(report);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteReport = async (id) => {
    try {
      await customFetch.delete(`/admin/reports/${id}`);
      toast.success("Báo cáo đã được xóa thành công!");
      navigate(location.pathname + location.search);
    } catch (error) {
      toast.error("Lỗi khi xóa báo cáo.");
      console.error("Delete Error:", error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", text: "Chờ xử lý", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
      resolved: { variant: "success", text: "Đã giải quyết", icon: TrendingUp, color: "bg-green-100 text-green-800" },
      default: { variant: "destructive", text: "Không xác định", icon: AlertTriangle, color: "bg-red-100 text-red-800" }
    };
    
    const config = statusConfig[status] || statusConfig.default;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} border-0 font-medium`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo phản hồi sản phẩm</h1>
                <p className="text-gray-600 mt-1">Quản lý và theo dõi các báo cáo phản hồi từ khách hàng</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Tổng báo cáo</p>
                <p className="text-2xl font-bold text-blue-600">{reports.totalItems || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Bộ lọc tìm kiếm</CardTitle>
                <CardDescription className="text-gray-600">Tìm kiếm và lọc các báo cáo phản hồi sản phẩm theo tiêu chí</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="searchUser" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-blue-500" /> Người dùng
                  </Label>
                  <Input
                    id="searchUser"
                    name="searchUser"
                    placeholder="Tìm theo tên hoặc email..."
                    defaultValue={searchParams.searchUser || ""}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchItem" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-green-500" /> Sản phẩm
                  </Label>
                  <Input
                    id="searchItem"
                    name="searchItem"
                    placeholder="Tìm theo tên sản phẩm..."
                    defaultValue={searchParams.searchItem || ""}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-purple-500" /> Từ ngày
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={searchParams.startDate || ""}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-purple-500" /> Đến ngày
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={searchParams.endDate || ""}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 font-medium">
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(location.pathname)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2.5 font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Đặt lại
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card className="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              Danh sách báo cáo phản hồi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 border-b">
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Người phản hồi</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Người bán</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Sản phẩm</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Đánh giá</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Ngày báo cáo</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.data && reports.data.length > 0 ? (
                    reports.data.map((report, index) => (
                      <TableRow key={report.id} className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {report.user?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{report.user?.name || "N/A"}</p>
                              <p className="text-sm text-gray-500">{report.user?.email || "N/A"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {report.item?.owner?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{report.item?.owner?.name || "N/A"}</p>
                              <p className="text-sm text-gray-500">{report.item?.owner?.email || "N/A"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-4">
                            {report.item?.images && report.item.images.length > 0 ? (
                              <img
                                src={report.item.images[0]}
                                alt={report.item.name}
                                className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 border border-gray-200">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 max-w-[200px] truncate">{report.item?.name || "N/A"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {renderStars(report.rating)}
                            <span className={`text-sm font-semibold ${getRatingColor(report.rating)}`}>
                              {report.rating}/5
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {new Date(report.date).toLocaleDateString("vi-VN")}
                            </p>
                            <p className="text-gray-500">
                              {new Date(report.date).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(report)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Xóa
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl">Xác nhận xóa báo cáo</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn báo cáo khỏi hệ thống.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-lg">Hủy bỏ</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="bg-red-600 hover:bg-red-700 rounded-lg"
                                  >
                                    Xóa báo cáo
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900">Không tìm thấy báo cáo nào</p>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              Hiện tại không có báo cáo phản hồi nào phù hợp với tiêu chí tìm kiếm. Hãy thử điều chỉnh bộ lọc hoặc kiểm tra lại sau.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {reports.totalPages > 1 && (
              <div className="border-t bg-gray-50/30 py-4">
                <div className="flex justify-center">
                  <PaginationDemo
                    currentPage={reports.currentPage}
                    totalPages={reports.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-gray-900">Chi tiết báo cáo</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Thông tin chi tiết báo cáo phản hồi
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          {currentReport && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium text-gray-600">ID Báo cáo</Label>
                  <p className="font-mono font-bold text-blue-600">#{currentReport.id}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-600">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(currentReport.status)}</div>
                </div>
              </div>

              {/* User & Seller Info */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <Label className="font-medium text-blue-800 text-sm flex items-center gap-1">
                    <User className="h-3 w-3" /> Người phản hồi
                  </Label>
                  <p className="font-medium text-gray-900 text-sm">{currentReport.user?.name || "N/A"}</p>
                  <p className="text-xs text-gray-600">{currentReport.user?.email || "N/A"}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <Label className="font-medium text-green-800 text-sm flex items-center gap-1">
                    <Package className="h-3 w-3" /> Người bán
                  </Label>
                  <p className="font-medium text-gray-900 text-sm">{currentReport.item?.owner?.name || "N/A"}</p>
                  <p className="text-xs text-gray-600">{currentReport.item?.owner?.email || "N/A"}</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <Label className="font-medium text-gray-800 text-sm flex items-center gap-1 mb-2">
                  <Package className="h-3 w-3" /> Sản phẩm
                </Label>
                <div className="flex items-center space-x-3">
                  {currentReport.item?.images && currentReport.item.images.length > 0 && (
                    <img 
                      src={currentReport.item.images[0]} 
                      alt={currentReport.item.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200" 
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{currentReport.item?.name || "N/A"}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(currentReport.rating)}
                      <span className={`text-xs font-semibold ${getRatingColor(currentReport.rating)}`}>
                        {currentReport.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {currentReport.title && (
                  <div>
                    <Label className="font-medium text-gray-600 text-sm">Tiêu đề</Label>
                    <p className="text-sm text-gray-900 mt-1">{currentReport.title}</p>
                  </div>
                )}
                <div>
                  <Label className="font-medium text-gray-600 text-sm">Nội dung</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg border text-sm">
                    <p className="text-gray-800 leading-relaxed">{currentReport.description}</p>
                  </div>
                </div>
                <div>
                  <Label className="font-medium text-gray-600 text-sm">Thời gian</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(currentReport.date).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-gray-100 pt-4">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50"
              >
                Đóng
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemFeedbackReport;