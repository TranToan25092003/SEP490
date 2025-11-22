import { Link, useLoaderData } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { fetchManagerDashboard } from "@/api/manager";

export async function loader() {
  try {
    const response = await fetchManagerDashboard();
    return response.data || {
      stats: {
        totalParts: 0,
        lowStockParts: 0,
        goodsReceiptsToday: 0,
        goodsReceiptsPending: 0,
        totalValue: 0,
        monthlyRevenue: 0,
      },
      barChartData: [],
      lowStockItems: [],
      recentGoodsReceipts: [],
    };
  } catch (error) {
    console.error("Error loading manager dashboard:", error);
    return {
      stats: {
        totalParts: 0,
        lowStockParts: 0,
        goodsReceiptsToday: 0,
        goodsReceiptsPending: 0,
        totalValue: 0,
        monthlyRevenue: 0,
      },
      barChartData: [],
      lowStockItems: [],
      recentGoodsReceipts: [],
    };
  }
}

function Manager() {
  const dashboardData = useLoaderData() || {
    stats: {
      totalParts: 0,
      lowStockParts: 0,
      goodsReceiptsToday: 0,
      goodsReceiptsPending: 0,
      totalValue: 0,
      monthlyRevenue: 0,
    },
    barChartData: [],
    lowStockItems: [],
    recentGoodsReceipts: [],
  };
  const { stats, barChartData, lowStockItems, recentGoodsReceipts } = dashboardData;

  const quickLinks = [
    { label: "Quản lý phụ tùng", to: "/manager/items" },
    { label: "Phiếu nhập kho", to: "/manager/goods-receipt-list" },
    { label: "Tạo phiếu nhập", to: "/manager/goods-receipt" },
    { label: "Thêm phụ tùng", to: "/manager/items/add" },
  ];

  const miniKpis = [
    { label: "Tỷ lệ tồn kho", value: 68, color: "bg-blue-500" },
    { label: "Đúng hạn nhập", value: 92, color: "bg-green-500" },
    { label: "Hiệu quả chi phí", value: 85, color: "bg-purple-500" },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quát</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý kho và theo dõi hoạt động nhập hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/manager/goods-receipt">
            <Button variant="default">Tạo phiếu nhập</Button>
          </Link>
          <Link to="/manager/items/add">
            <Button variant="outline">Thêm phụ tùng</Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tổng số phụ tùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalParts}</p>
            <p className="text-xs text-blue-600 mt-1">+15 so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Phụ tùng sắp hết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.lowStockParts}</p>
            <p className="text-xs text-red-600 mt-1">Cần nhập hàng ngay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Phiếu nhập hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.goodsReceiptsToday}</p>
            <p className="text-xs text-green-600 mt-1">{stats.goodsReceiptsPending} phiếu đang chờ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Giá trị tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Tổng giá trị hiện tại</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle: Revenue chart + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Doanh thu nhập hàng theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mini bar chart */}
            {barChartData && barChartData.length > 0 ? (
              <>
                <div className="flex items-end gap-2 h-40">
                  {barChartData.map((item, i) => {
                    const maxValue = Math.max(...barChartData.map(d => d.DoanhThu), 1);
                    const h = maxValue > 0 ? (item.DoanhThu / maxValue) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 bg-gray-100 rounded">
                        <div
                          style={{ height: `${h}%` }}
                          className="bg-blue-500 rounded-t"
                        ></div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  {barChartData.map((item, i) => (
                    <span key={i}>{item.month}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Doanh thu tháng này</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </span>
              </div>
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
                    <p className="text-sm font-medium group-hover:text-blue-600">
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

      {/* Bottom: Low stock + Recent receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Phụ tùng sắp hết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-3">
              {lowStockItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Tồn: {item.stock} / Tối thiểu: {item.minStock}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                    Cảnh báo
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/manager/items">
              <Button variant="link" className="px-0 mt-3">
                Xem tất cả phụ tùng
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Phiếu nhập gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGoodsReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{receipt.id}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            receipt.status === "Hoàn thành"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {receipt.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {receipt.supplier} • {receipt.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(receipt.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/manager/goods-receipt-list">
              <Button variant="link" className="px-0 mt-3">
                Xem tất cả phiếu nhập
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

Manager.loader = loader;

export default Manager;
