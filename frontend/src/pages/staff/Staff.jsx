import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Staff() {
  // Demo numbers – có thể thay bằng dữ liệu thật từ API khi cần
  const stats = {
    bookingsToday: 8,
    ordersInProgress: 12,
    ordersWaiting: 5,
    complaintsOpen: 3,
    lowStockParts: 7,
  };

  const quickLinks = [
    { label: "Đặt lịch", to: "/staff/booking" },
    { label: "Lệnh dịch vụ", to: "/staff/service-order" },
    { label: "Xem tồn kho", to: "/staff/complaints" },
    { label: "Phụ tùng", to: "/staff/items" },
    { label: "Quản lý bay", to: "/staff/bays" },
    { label: "Chat", to: "/staff/chat" },
  ];

  const miniKpis = [
    { label: "Tỷ lệ hoàn thành", value: 76, color: "bg-green-500" },
    { label: "Đúng hẹn", value: 64, color: "bg-blue-500" },
    { label: "Hài lòng", value: 88, color: "bg-yellow-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quát</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ảnh chụp nhanh hoạt động hôm nay của bộ phận kỹ thuật
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/staff/service-order">
            <Button variant="default">Tạo lệnh mới</Button>
          </Link>
          <Link to="/staff/booking">
            <Button variant="outline">Xem lịch hẹn</Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Đặt lịch hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.bookingsToday}</p>
            <p className="text-xs text-green-600 mt-1">+2 so với hôm qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Đang xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.ordersInProgress}</p>
            <p className="text-xs text-blue-600 mt-1">3 việc sắp đến hạn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Chờ tiếp nhận
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.ordersWaiting}</p>
            <p className="text-xs text-amber-600 mt-1">Ưu tiên phân bay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Khiếu nại mở
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.complaintsOpen}</p>
            <p className="text-xs text-red-600 mt-1">
              Cần phản hồi trong hôm nay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle: Workload + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tải công việc theo giờ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mini bar chart không cần thư viện */}
            <div className="flex items-end gap-2 h-40">
              {Array.from({ length: 12 }).map((_, i) => {
                const h = [10, 20, 35, 50, 70, 90, 80, 60, 40, 30, 20, 15][i];
                return (
                  <div key={i} className="flex-1 bg-gray-100 rounded">
                    <div
                      style={{ height: `${h}%` }}
                      className="bg-red-500 rounded-t"
                    ></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Truy cập nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((l) => (
                <Link key={l.to} to={l.to} className="group">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 transition">
                    <p className="text-sm font-medium group-hover:text-red-600">
                      {l.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {miniKpis.map((kpi) => (
                <div key={kpi.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{kpi.label}</span>
                    <span className="font-medium">{kpi.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded">
                    <div
                      className={`h-2 rounded ${kpi.color}`}
                      style={{ width: `${kpi.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Inventory + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Phụ tùng sắp hết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="truncate">Phụ tùng #{i + 1}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Còn ít
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/staff/items">
              <Button variant="link" className="px-0 mt-2">
                Xem tồn kho
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Ghi chú nội bộ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Nhớ xác nhận phụ tùng trước 10:00",
                "Xe BK-1234 ưu tiên hoàn thành sớm",
                "Cập nhật báo cáo chất lượng tuần này",
                "Kiểm tra dụng cụ tại bay 3",
              ].map((note, i) => (
                <div key={i} className="p-3 border rounded-lg bg-white">
                  <p className="text-sm">{note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
