import React, { useState } from "react"; // Thêm useState
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom"; // Thêm useRevalidator
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, User, Globe, Ban } from "lucide-react"; // Thêm icon Ban
import { // Import các thành phần AlertDialog
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea"; // Để nhập lý do ban
import { Label } from "@/components/ui/label"; // Để label cho Textarea

export const reportDetailLoader = async ({ params }) => {
  try {
    const response = await customFetch.get(`/admin/reports/${params.reportId}`);
    return { report: response.data };
  } catch (error) {
    toast.error("Lỗi khi tải chi tiết báo cáo");
    console.error("Loader Error:", error);
    return { report: null, error: "Không thể tải chi tiết báo cáo." };
  }
};

const ReportDetail = () => {
  const { report, error } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator(); // Sử dụng useRevalidator để làm mới dữ liệu loader
  const [banReason, setBanReason] = useState(""); // State cho lý do cấm
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false); // State quản lý dialog ban
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false); // State quản lý dialog unban

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error || "Không tìm thấy báo cáo"}</p>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/reports")}
              className="mt-4"
            >
              Quay lại danh sách báo cáo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReportedUserIP = report.reportedUser.id.startsWith('IP_');

  // Hàm xử lý ban người dùng
  const handleBanUser = async () => {
    try {
      await customFetch.post(`/admin/users/${report.reportedUser.id}/ban`, { reason: banReason });
      toast.success(`Người dùng ${report.reportedUser.name} đã bị cấm.`);
      setIsBanDialogOpen(false); // Đóng dialog
      setBanReason(""); // Xóa lý do
      revalidator.revalidate(); // Tải lại dữ liệu để cập nhật trạng thái
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi khi cấm người dùng.");
      console.error("Ban user error:", error);
    }
  };

  // Hàm xử lý bỏ cấm người dùng
  const handleUnbanUser = async () => {
    try {
      await customFetch.post(`/admin/users/${report.reportedUser.id}/unban`);
      toast.success(`Người dùng ${report.reportedUser.name} đã được bỏ cấm.`);
      setIsUnbanDialogOpen(false); // Đóng dialog
      revalidator.revalidate(); // Tải lại dữ liệu để cập nhật trạng thái
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi khi bỏ cấm người dùng.");
      console.error("Unban user error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Chi tiết báo cáo
            </CardTitle>
            <CardDescription>Mã báo cáo: {report.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Tiêu đề</p>
              <p className="text-slate-800">{report.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Mô tả</p>
              <p className="text-slate-800">{report.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Loại báo cáo</p>
              <Badge className="bg-orange-100 text-orange-800">
                {report.reportType}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <User className="w-4 h-4" />
                Người bị báo cáo
              </p>
              <p className="text-slate-800">
                {report.reportedUser.name}
                {/* Hiển thị trạng thái banned */}
                {report.reportedUser.isBanned ? (
                  <Badge className="ml-2 bg-red-100 text-red-800">
                    <Ban className="w-3 h-3 mr-1" /> Đã bị cấm
                  </Badge>
                ) : (
                  <Badge className="ml-2 bg-green-100 text-green-800">Đang hoạt động</Badge>
                )}
              </p>
              <p className="text-sm text-slate-500">{report.reportedUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <User className="w-4 h-4" />
                Người báo cáo
              </p>
              <p className="text-slate-800">
                {report.reporter.name}
                 {/* Hiển thị trạng thái banned cho Reporter (nếu cần) */}
                {report.reporter.isBanned ? (
                  <Badge className="ml-2 bg-red-100 text-red-800">
                    <Ban className="w-3 h-3 mr-1" /> Đã bị cấm
                  </Badge>
                ) : (
                  report.reporter.id !== 'System' && <Badge className="ml-2 bg-green-100 text-green-800">Đang hoạt động</Badge>
                )}
              </p>
              <p className="text-sm text-slate-500">{report.reporter.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ngày tạo
              </p>
              <p className="text-slate-800">{new Date(report.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Trạng thái</p>
              <Badge
                variant={report.status === 'pending' ? 'secondary' : 'default'}
                className={report.status === 'pending' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}
              >
                {report.status === 'pending' ? 'Đang chờ xử lý' : 'Đã xử lý'}
              </Badge>
            </div>
            
            <div className="flex gap-3 flex-wrap"> {/* Thêm flex-wrap để tránh tràn */}
              <Button
                variant="outline"
                onClick={() => navigate("/admin/report")}
                className="border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Quay lại danh sách báo cáo
              </Button>
              {/* Nút xem chi tiết người dùng */}
             

              {/* Nút Ban/Unban */}
              {report.reportedUser.id && !isReportedUserIP && ( // Chỉ hiển thị nếu không phải IP và có ID người dùng
                !report.reportedUser.isBanned ? (
                  <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
                        <Ban className="w-4 h-4 mr-2" /> Cấm người dùng
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận cấm người dùng</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn cấm người dùng này không?
                          Hành động này sẽ hạn chế quyền truy cập của họ vào một số chức năng của hệ thống.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4 py-4">
                        <Label htmlFor="banReason">Lý do cấm (Tùy chọn):</Label>
                        <Textarea
                          id="banReason"
                          placeholder="Nhập lý do cấm người dùng (ví dụ: vi phạm chính sách spam)."
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBanUser}>
                          Xác nhận cấm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Globe className="w-4 h-4 mr-2" /> Bỏ cấm người dùng
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận bỏ cấm người dùng</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn bỏ cấm người dùng này không?
                          Họ sẽ có thể truy cập lại tất cả các chức năng.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnbanUser}>
                          Xác nhận bỏ cấm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportDetail;