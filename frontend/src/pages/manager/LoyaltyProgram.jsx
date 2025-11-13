import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Coins,
  Gift,
  History,
  Layers,
  Link2,
  Repeat,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value ?? 0);
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
const formatPoints = (value) => `${formatNumber(value)} điểm`;

const earningRules = [
  {
    id: "purchase",
    title: "Mua hàng",
    ratio: "1 điểm = 10.000₫",
    bonus: "+5% cho hóa đơn > 2.000.000₫",
    limit: "Không giới hạn",
    expiry: "12 tháng",
    channel: "Tự động qua hóa đơn",
  },
  {
    id: "maintenance",
    title: "Bảo dưỡng hoàn tất",
    ratio: "+50 điểm/lệnh",
    bonus: "Đạt chuẩn MotorMate",
    limit: "3 lần/tháng",
    expiry: "12 tháng",
    channel: "Kích hoạt bởi cố vấn dịch vụ",
  },
  {
    id: "checkin",
    title: "Check-in mỗi ngày",
    ratio: "+5 điểm/lần",
    bonus: "Giới hạn 1 lần/ngày",
    limit: "Theo ngày",
    expiry: "15 ngày",
    channel: "Ứng dụng/ki-ốt tự phục vụ",
  },
  {
    id: "referral",
    title: "Giới thiệu bạn bè",
    ratio: "+200 điểm/giao dịch",
    bonus: "Khi người được mời hoàn tất đơn đầu tiên",
    limit: "5 lượt/tháng",
    expiry: "12 tháng",
    channel: "Link giới thiệu, cần kiểm duyệt",
  },
];

const redemptionCatalog = [
  {
    id: "voucher-50",
    reward: "Voucher 50.000₫",
    cost: 500,
    delivery: "Sinh mã giảm giá",
    stock: "Còn 128 mã",
    note: "Áp dụng dịch vụ tiêu chuẩn",
  },
  {
    id: "voucher-120",
    reward: "Voucher 120.000₫",
    cost: 1000,
    delivery: "Sinh mã giảm giá",
    stock: "Còn 62 mã",
    note: "Ưu tiên dịch vụ Premium",
  },
  {
    id: "cashback",
    reward: "Hoàn tiền 5%",
    cost: 1500,
    delivery: "Trừ trực tiếp trên hóa đơn",
    stock: "Không giới hạn",
    note: "Đơn từ 1.000.000₫",
  },
];

const transactionHistory = [
  {
    id: "TX-12032",
    member: "Nguyễn Minh Khoa",
    action: "Mua hàng",
    delta: 120,
    balance: 1420,
    detail: "Invoice #MM-0045",
    performedBy: "Hệ thống",
    channel: "POS",
    timestamp: "10:21 • 12/11/2025",
  },
  {
    id: "TX-12019",
    member: "Trần Hà Vy",
    action: "Đổi voucher 50k",
    delta: -500,
    balance: 860,
    detail: "Voucher #VC-9952",
    performedBy: "Khách hàng",
    channel: "App",
    timestamp: "18:05 • 11/11/2025",
  },
  {
    id: "TX-11998",
    member: "Lâm Tuấn Kiệt",
    action: "Giới thiệu thành công",
    delta: 200,
    balance: 1760,
    detail: "Referral #RF-224",
    performedBy: "Hệ thống",
    channel: "Referral",
    timestamp: "15:42 • 10/11/2025",
  },
  {
    id: "TX-11975",
    member: "Phạm Diệu Ngọc",
    action: "Check-in ngày",
    delta: 5,
    balance: 245,
    detail: "Check-in streak: 7 ngày",
    performedBy: "Khách hàng",
    channel: "App",
    timestamp: "08:02 • 10/11/2025",
  },
];

const auditLogs = [
  {
    id: "LOG-8202",
    actor: "Admin • Hoàng Anh",
    change: "+50 điểm",
    reason: "Điều chỉnh thủ công ticket #452",
    risk: "Thấp",
    timestamp: "09:11 • 09/11/2025",
  },
  {
    id: "LOG-8192",
    actor: "Rule Engine",
    change: "Khóa check-in",
    reason: "Phát hiện 4 lần check-in/1 giờ",
    risk: "Cảnh báo",
    timestamp: "21:35 • 08/11/2025",
  },
  {
    id: "LOG-8188",
    actor: "Admin • Bích Phương",
    change: "Cập nhật tỷ lệ quy đổi",
    reason: "Chiến dịch Black Friday",
    risk: "Trung bình",
    timestamp: "14:18 • 08/11/2025",
  },
];

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/points/award",
    desc: "Cộng điểm sau khi hành động hoàn tất.",
  },
  {
    method: "POST",
    path: "/api/points/redeem",
    desc: "Trừ điểm và sinh voucher hoặc hoàn tiền.",
  },
  {
    method: "GET",
    path: "/api/points/balance?userId=",
    desc: "Lấy ví điểm hiện tại và hạn sử dụng.",
  },
  {
    method: "GET",
    path: "/api/points/history?userId=",
    desc: "Chi tiết giao dịch/ticket đối chiếu.",
  },
  {
    method: "POST",
    path: "/api/points/admin/adjust",
    desc: "Điều chỉnh thủ công, ghi audit log bắt buộc.",
  },
];

const customerGuide = [
  "Xem ví điểm tại mục \"Ví điểm\" để biết số dư và hạn sử dụng.",
  "Tích điểm khi thanh toán dịch vụ, check-in, tham gia khuyến mãi.",
  "Giới thiệu bạn bè bằng link/mã riêng, điểm cộng khi đơn đầu hoàn tất.",
  "Đổi điểm trong mục \"Đổi quà\" để lấy voucher hoặc giảm trực tiếp.",
  "Khi có vấn đề hãy liên hệ hỗ trợ kèm mã giao dịch hoặc ảnh màn hình.",
];

const adminGuide = [
  "Cấu hình tỷ lệ tích điểm, hạn sử dụng và ngưỡng đổi theo chiến dịch.",
  "Theo dõi và lọc giao dịch để duyệt các yêu cầu nghi vấn.",
  "Dùng audit log để kiểm soát mọi điều chỉnh thủ công.",
  "Kết nối automation: gửi email/thông báo khi điểm sắp hết hạn.",
  "Báo cáo tổng điểm theo thời gian, chiến dịch, top người dùng.",
];

const LoyaltyProgram = () => {
  const [historyScope, setHistoryScope] = useState("all");

  const stats = useMemo(
    () => ({
      engagedMembers: 1245,
      activeMembers: 892,
      totalPoints: 320450,
      redeemedPoints: 187300,
      expiringSoon: 14500,
      campaigns: 4,
    }),
    []
  );

  const filteredHistory = useMemo(() => {
    if (historyScope === "earn") {
      return transactionHistory.filter((item) => item.delta > 0);
    }
    if (historyScope === "redeem") {
      return transactionHistory.filter((item) => item.delta < 0);
    }
    return transactionHistory;
  }, [historyScope]);

  const expiringPercentage = Math.min(
    Math.round((stats.expiringSoon / stats.totalPoints) * 100),
    100
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase font-semibold text-muted-foreground tracking-wide">
            Loyalty Hub
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Chương trình điểm thưởng MotorMate
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Khuyến khích khách hàng quay lại bằng việc thưởng – đổi điểm minh
            bạch, chống gian lận và theo dõi realtime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <History className="size-4" />
            Lịch sử điều chỉnh
          </Button>
          <Button className="gap-2">
            <Settings className="size-4" />
            Cấu hình quy tắc
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-amber-100 bg-amber-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-amber-700">
              Thành viên tham gia
            </CardTitle>
            <UsersRound className="size-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-900">
              {formatNumber(stats.engagedMembers)}
            </p>
            <p className="text-xs text-amber-700 mt-2">
              {formatNumber(stats.activeMembers)} hoạt động tuần này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-gray-500">
              Tổng điểm đang lưu hành
            </CardTitle>
            <Coins className="size-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPoints(stats.totalPoints)}
            </p>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <ArrowUpRight className="size-3.5" />
              +12% vs tháng trước
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-gray-500">
              Điểm đã quy đổi
            </CardTitle>
            <Gift className="size-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">
              {formatPoints(stats.redeemedPoints)}
            </p>
            <div className="flex items-center gap-1 text-xs text-rose-500 mt-2">
              <ArrowDownRight className="size-3.5" />
              4.2% quy đổi tuần này
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase tracking-wider text-gray-500">
              Điểm sắp hết hạn (30 ngày)
            </CardTitle>
            <BellRing className="size-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-600">
              {formatPoints(stats.expiringSoon)}
            </p>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-orange-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-400"
                  style={{ width: `${expiringPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {expiringPercentage}% tổng điểm • bật nhắc nhở tự động
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Cấu hình quy tắc tích điểm</CardTitle>
              <p className="text-sm text-muted-foreground">
                Theo dõi tỷ lệ, hạn mức và kênh kích hoạt của từng hành động.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3.5" />
              {earningRules.length} hành động đang bật
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {earningRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border p-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{rule.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {rule.channel}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rule.expiry} hết hạn
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Tỷ lệ
                    </p>
                    <p className="font-medium text-gray-900">{rule.ratio}</p>
                    <p className="text-xs text-green-600 mt-1">{rule.bonus}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Hạn mức
                    </p>
                    <p className="font-medium text-gray-900">{rule.limit}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Ghi chú
                    </p>
                    <p className="font-medium text-gray-900">{rule.channel}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ví điểm & cảnh báo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tình trạng tổng quát ví điểm khách hàng.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ví đang hoạt động</span>
                  <span className="font-semibold">
                    {formatNumber(stats.activeMembers)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Ví bị khóa/tạm dừng</span>
                  <span className="font-semibold text-orange-500">18</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Ví cần xác minh</span>
                  <span className="font-semibold text-rose-500">6</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-green-600" />
                  <p>Kiểm duyệt tự động các giao dịch lớn & hành vi lặp.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Repeat className="size-4 text-blue-600" />
                  <p>Nhắc nhở điểm sắp hết hạn sau 12 tháng phát sinh.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="size-4 text-purple-600" />
                  <p>Giới hạn quy đổi tối thiểu 500 điểm (cấu hình được).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Gói quy đổi nổi bật</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gán vào chiến dịch bán chéo hoặc marketing automation.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {redemptionCatalog.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-lg border p-3 text-sm hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reward.reward}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reward.note}
                      </p>
                    </div>
                    <Badge variant="success">{reward.stock}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase text-muted-foreground">
                    <span>{formatPoints(reward.cost)}</span>
                    <span>{reward.delivery}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Lịch sử phát sinh & Audit log</CardTitle>
              <p className="text-sm text-muted-foreground">
                Theo dõi từng giao dịch cộng/trừ điểm kèm lý do, người thực hiện.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Hiển thị</span>
              <div className="inline-flex rounded-full border bg-muted/40 p-1">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "earn", label: "Tích điểm" },
                  { key: "redeem", label: "Quy đổi" },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setHistoryScope(option.key)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                      historyScope === option.key
                        ? "bg-white shadow text-gray-900"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions" className="gap-2">
                <Activity className="size-4" />
                Giao dịch điểm
              </TabsTrigger>
              <TabsTrigger value="audits" className="gap-2">
                <History className="size-4" />
                Audit log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã giao dịch</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Điểm +/-</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Kênh</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">
                        {item.id}
                        <p className="text-xs text-muted-foreground">
                          {item.timestamp}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{item.member}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.performedBy}
                        </p>
                      </TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            item.delta > 0 ? "text-green-600" : "text-rose-600"
                          }`}
                        >
                          {item.delta > 0 ? "+" : "-"}
                          {formatNumber(Math.abs(item.delta))} điểm
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatNumber(item.balance)} điểm
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.channel}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.detail}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="audits">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã log</TableHead>
                    <TableHead>Thực hiện</TableHead>
                    <TableHead>Thay đổi</TableHead>
                    <TableHead>Rủi ro</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-semibold">{log.id}</TableCell>
                      <TableCell>{log.actor}</TableCell>
                      <TableCell>{log.change}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.risk === "Cảnh báo"
                              ? "destructive"
                              : log.risk === "Trung bình"
                              ? "secondary"
                              : "success"
                          }
                        >
                          {log.risk}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn & cam kết hiển thị</CardTitle>
            <p className="text-sm text-muted-foreground">
              Đảm bảo người dùng luôn biết cách tích/đổi điểm và điều kiện áp
              dụng.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase font-semibold text-muted-foreground mb-3">
                <UsersRound className="size-4" />
                Người dùng
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {customerGuide.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase font-semibold text-muted-foreground mb-3">
                <ShieldCheck className="size-4" />
                Quản trị
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {adminGuide.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API & tích hợp</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dùng làm checklist khi backend hoàn thiện endpoint.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="rounded-lg border p-3 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant={
                      endpoint.method === "GET" ? "secondary" : "outline"
                    }
                    className="text-xs uppercase"
                  >
                    {endpoint.method}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Link2 className="size-3" />
                    REST
                  </Badge>
                </div>
                <p className="mt-3 font-mono text-xs text-gray-900">
                  {endpoint.path}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {endpoint.desc}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-100 bg-indigo-50">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
              Nhắc nhở vận hành
            </p>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">
              Luôn thông báo khi điểm được cộng, đổi hoặc sắp hết hạn
            </h2>
            <p className="text-sm text-indigo-700 mt-2">
              Kích hoạt email/notification song song để tăng tương tác và giảm
              khiếu nại nhầm lẫn.
            </p>
          </div>
          <div className="space-y-2 text-sm text-indigo-900">
            <div className="flex items-center gap-2">
              <BellRing className="size-4" />
              Push/App notification
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Dashboard báo cáo theo chiến dịch
            </div>
            <div className="flex items-center gap-2">
              <UsersRound className="size-4" />
              Top khách hàng có nhiều điểm
            </div>
          </div>
          <Button className="w-full md:w-auto gap-2">
            <Gift className="size-4" />
            Khởi tạo chiến dịch mới
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyProgram;
