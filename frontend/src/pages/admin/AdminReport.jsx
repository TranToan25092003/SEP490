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
import { Search, Calendar, User, Package, TrendingUp, AlertTriangle, DollarSign, Users, Crown, Clock, Trash2 } from "lucide-react";
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

export const adminReportLoader = async ({ request }) => {
  const params = Object.fromEntries([
    ...new URL(request.url).searchParams.entries(),
  ]);

  // Đặt giới hạn mặc định là 6 sản phẩm mỗi trang
  params.limit = params.limit || 6;

  try {
    const response = await customFetch.get("/admin/reports", { params });
    return {
      transactions: response.data.transactions,
      statistics: response.data.statistics,
      searchParams: params,
    };
  } catch (error) {
    toast.error("Lỗi khi tải báo cáo quản trị");
    console.error("Loader Error:", error);
    return {
      transactions: { data: [], totalItems: 0, totalPages: 0, currentPage: 1 },
      statistics: {
        topTransactingUsers: [],
        reliableSellers: [],
        mostReportedUsers: [],
        mostProblematicBorrowers: [],
        otherReportStats: {},
      },
      searchParams: params,
      error: "Không thể tải dữ liệu báo cáo.",
    };
  }
};

const AdminReport = () => {
  const { transactions, statistics, searchParams, error } = useLoaderData();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [localStartDate, setLocalStartDate] = useState(searchParams.startDate || "");
  const [localEndDate, setLocalEndDate] = useState(searchParams.endDate || "");
  const [localSearchUser, setLocalSearchUser] = useState(searchParams.searchUser || "");
  const [localSearchItem, setLocalSearchItem] = useState(searchParams.searchItem || "");

  const handleSearch = (e) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(location.search);

    // Giữ nguyên limit đã được đặt trong loader hoặc từ URL
    currentParams.set("limit", searchParams.limit || 6);

    if (localStartDate) currentParams.set("startDate", localStartDate); else currentParams.delete("startDate");
    if (localEndDate) currentParams.set("endDate", localEndDate); else currentParams.delete("endDate");
    if (localSearchUser) currentParams.set("searchUser", localSearchUser); else currentParams.delete("searchUser");
    if (localSearchItem) currentParams.set("searchItem", localSearchItem); else currentParams.delete("searchItem");

    currentParams.set("page", 1); // Reset về trang 1 khi áp dụng bộ lọc mới
    navigate(`${location.pathname}?${currentParams.toString()}`);
  };

  const handlePageChange = (page) => {
    const currentParams = new URLSearchParams(location.search);
    currentParams.set("page", page);
    navigate(`${location.pathname}?${currentParams.toString()}`);
  };

  const clearFilters = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    setLocalSearchUser("");
    setLocalSearchItem("");
    // Khi xóa bộ lọc, cũng reset về trang 1 và xóa các tham số tìm kiếm, giữ nguyên limit
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("limit", searchParams.limit || 6);
    navigate(`${location.pathname}?${newSearchParams.toString()}`);
  };

  const handleDeleteReport = async (reportId) => {

    try {
      await customFetch.delete(`/admin/reports/${reportId}`);
      toast.success("Đã xóa báo cáo thành công");
      // Reload trang để cập nhật dữ liệu
      window.location.reload();
    } catch (error) {
      console.error("Lỗi khi xóa báo cáo:", error);
      toast.error("Không thể xóa báo cáo. Vui lòng thử lại.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bảng Điều Khiển Quản Trị</h1>
          <p className="text-gray-600">Báo cáo và phân tích toàn diện</p>
        </div>

        {/* Filters & Search Section */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Search className="w-5 h-5" />
              Bộ Lọc & Tìm Kiếm
            </CardTitle>
            <CardDescription>Lọc giao dịch theo khoảng thời gian, người dùng hoặc sản phẩm</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Inputs */}
                <div className="space-y-2">
                  <Label htmlFor="searchUser" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4" />
                    Tìm Người Dùng
                  </Label>
                  <Input
                    id="searchUser"
                    type="text"
                    placeholder="Tên hoặc email người dùng"
                    value={localSearchUser}
                    onChange={(e) => setLocalSearchUser(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchItem" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="w-4 h-4" />
                    Tìm Sản Phẩm
                  </Label>
                  <Input
                    id="searchItem"
                    type="text"
                    placeholder="Tên sản phẩm"
                    value={localSearchItem}
                    onChange={(e) => setLocalSearchItem(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Ngày Bắt Đầu
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Ngày Kết Thúc
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Xóa Bộ Lọc
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Áp Dụng Bộ Lọc
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Transacting Users */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                Người Dùng Giao Dịch Nhiều Nhất
              </CardTitle>
              <CardDescription>Những người dùng có khối lượng giao dịch cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topTransactingUsers.length > 0 ? (
                <div className="space-y-3">
                  {statistics.topTransactingUsers.map((userStat, index) => (
                    <div key={userStat.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{userStat.user.name}</p>
                          <p className="text-sm text-gray-500">{userStat.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {userStat.transactionCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Không có dữ liệu giao dịch</p>
                  <p className="text-sm">Dữ liệu giao dịch sẽ xuất hiện ở đây khi có</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reputable Sellers */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Crown className="w-5 h-5" />
                Người Bán Uy Tín
              </CardTitle>
              <CardDescription>Những người bán có tỷ lệ thành công cao và danh tiếng tốt</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.reliableSellers && statistics.reliableSellers.length > 0 ? (
                <div className="space-y-3">
                  {statistics.reliableSellers.map((sellerStat, index) => (
                    <div key={sellerStat.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{sellerStat.user.name}</p>
                          <p className="text-sm text-gray-500">{sellerStat.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {sellerStat.averageRating ? sellerStat.averageRating.toFixed(1) : 'N/A'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Crown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Không có dữ liệu người bán uy tín</p>
                  <p className="text-sm">Dữ liệu danh tiếng người bán sẽ xuất hiện ở đây</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Reported Users */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="w-5 h-5" />
                Người Dùng Bị Báo Cáo Nhiều Nhất
              </CardTitle>
              <CardDescription>Những người dùng đã bị báo cáo nhiều lần</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.mostReportedUsers && statistics.mostReportedUsers.length > 0 ? (
                <div className="space-y-3">
                  {statistics.mostReportedUsers.map((reportedUserStat, index) => (
                    <div key={reportedUserStat.user.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{reportedUserStat.user.name}</p>
                            <p className="text-sm text-gray-500">{reportedUserStat.user.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {reportedUserStat.reportCount} Báo Cáo
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Báo cáo:</p>
                        {reportedUserStat.reports.map(report => (
                          <div key={report._id} className="flex items-center justify-between mt-1 pl-4 border-l-2 border-orange-200">
                            <p className="text-sm text-gray-600 truncate">
                              {report.title} ({new Date(report.createdAt).toLocaleDateString()})
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/reports/${report._id}`)}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                Xem Chi Tiết
                              </Button>
                              <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-300 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xác nhận xóa báo cáo?</AlertDialogTitle>
      <AlertDialogDescription>
        Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Hủy</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDeleteReport(report._id)}>
        Xóa
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Không có dữ liệu người dùng bị báo cáo</p>
                  <p className="text-sm">Người dùng có nhiều báo cáo sẽ xuất hiện ở đây</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Clock className="w-5 h-5" />
                Người Mượn Có Vấn Đề Nhất
              </CardTitle>
              <CardDescription>Những người mượn có sản phẩm trả muộn hoặc không trả</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.mostProblematicBorrowers && statistics.mostProblematicBorrowers.length > 0 ? (
                <div className="space-y-3">
                  {statistics.mostProblematicBorrowers.map((borrowerStat, index) => (
                    <div key={borrowerStat.user.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{borrowerStat.user.name}</p>
                            <p className="text-sm text-gray-500">{borrowerStat.user.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {borrowerStat.totalViolations} Vi Phạm
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Trả Muộn: {borrowerStat.lateCount}</p>
                        <p>Không Trả: {borrowerStat.unreturnedCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Không có dữ liệu người mượn có vấn đề</p>
                  <p className="text-sm">Người mượn có sản phẩm trả muộn hoặc không trả sẽ xuất hiện ở đây</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5" />
              Lịch Sử Giao Dịch
              <Badge variant="outline" className="ml-2">
                {transactions.totalItems} tổng cộng
              </Badge>
            </CardTitle>
            <CardDescription>Bản ghi giao dịch đầy đủ với thông tin người dùng và sản phẩm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Loại</TableHead>
                    <TableHead className="font-semibold text-gray-700">Sản Phẩm</TableHead>
                    <TableHead className="font-semibold text-gray-700">Người Dùng</TableHead>
                    <TableHead className="font-semibold text-gray-700">Số Tiền</TableHead>
                    <TableHead className="font-semibold text-gray-700">Ngày</TableHead>
                    <TableHead className="font-semibold text-gray-700">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.length > 0 ? (
                    transactions.data.map((txn, index) => (
                      <TableRow key={txn.transactionId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                        <TableCell>
                          <Badge
                            variant={txn.type === 'Buy' ? 'default' : 'secondary'}
                            className={txn.type === 'Buy' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {txn.type === 'Buy' ? 'Mua' : txn.type === 'Borrow' ? 'Mượn' : txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {txn.item ? (
                            <div className="flex items-center gap-3">
                              {txn.item.images && txn.item.images.length > 0 && (
                                <img
                                  src={txn.item.images[0]}
                                  alt={txn.item.name}
                                  className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                />
                              )}
                              <span className="font-medium text-gray-800">{txn.item.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-800">{txn.user.name}</p>
                            <p className="text-sm text-gray-500">{txn.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">{txn.totalAmount.toLocaleString('vi-VN')} VND</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600">{new Date(txn.date).toLocaleDateString('vi-VN')}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txn.status === 'completed' ? 'default' :
                              txn.status === 'late' ? 'destructive' :
                              txn.status === 'unreturned' ? 'destructive' :
                              'secondary'
                            }
                            className={
                              txn.status === 'late' ? 'bg-red-100 text-red-800' :
                              txn.status === 'unreturned' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {txn.status === 'completed' ? 'Hoàn Thành' :
                             txn.status === 'late' ? 'Trễ Hạn' :
                             txn.status === 'unreturned' ? 'Chưa Trả' :
                             txn.status === 'pending' ? 'Chờ Xử Lý' :
                             txn.status || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="space-y-2">
                          <Package className="w-10 h-10 mx-auto text-gray-300" />
                          <p className="text-gray-500 font-medium">Không tìm thấy giao dịch nào</p>
                          <p className="text-sm text-gray-400">Thử điều chỉnh bộ lọc tìm kiếm</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {transactions.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <PaginationDemo
                  currentPage={transactions.currentPage}
                  totalPages={transactions.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReport;