import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  CheckCircle2,
  Gift,
  History,
  Link2,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  TicketCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { getPointBalance, getPointHistory } from "@/api/loyalty";

const formatPoints = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)} điểm`;

const INITIAL_WALLET = {
  balance: 0,
  expiringSoon: 0,
  expiringDate: null,
  tier: "Bạc",
  tierBenefits: "Hoàn tiền 2% và ưu tiên đặt lịch",
  streakDays: 0,
  nextRewardThreshold: 1500,
  vouchersOwned: 0,
  updatedAt: null,
};

const earningActions = [
  {
    id: "purchase",
    title: "Thanh toán dịch vụ",
    desc: "1 điểm cho mỗi 10.000₫ chi tiêu, tự cộng sau khi hoá đơn hoàn tất.",
    points: "+120 điểm",
    icon: Wallet,
  },
  {
    id: "maintenance",
    title: "Hoàn tất bảo dưỡng",
    desc: "+50 điểm cho gói bảo dưỡng chuẩn MotorMate.",
    points: "+50 điểm",
    icon: Star,
  },
  {
    id: "checkin",
    title: "Check-in mỗi ngày",
    desc: "+5 điểm/lần, tối đa 1 lần/ngày. Giữ streak để nhận quà.",
    points: "+5 điểm",
    icon: Repeat,
  },
  {
    id: "referral",
    title: "Giới thiệu bạn bè",
    desc: "+200 điểm khi bạn bè hoàn tất đơn đầu tiên qua link của bạn.",
    points: "+200 điểm",
    icon: Link2,
  },
];

const rewardsCatalog = [
  {
    id: "voucher-50",
    title: "Voucher 50.000₫",
    cost: 500,
    desc: "Áp dụng thanh toán dịch vụ chăm sóc chuẩn.",
    stock: "Còn 128 mã",
  },
  {
    id: "voucher-120",
    title: "Voucher 120.000₫",
    cost: 1000,
    desc: "Ưu đãi cho gói bảo dưỡng Premium.",
    stock: "Còn 62 mã",
  },
  {
    id: "cashback",
    title: "Hoàn tiền 5%",
    cost: 1500,
    desc: "Khấu trừ trực tiếp đơn từ 1.000.000₫.",
    stock: "Không giới hạn",
  },
];

const reminders = [
  "Điểm hết hạn sau 12 tháng kể từ ngày phát sinh.",
  "Điểm quy đổi tối thiểu 500 điểm/lần để sinh voucher.",
  "Luôn thông báo qua email/app khi điểm cộng, đổi hoặc sắp hết hạn.",
  "Giữ mã giao dịch hoặc chụp màn hình để hỗ trợ nhanh khi có sự cố.",
];

const SOURCE_CHANNEL_LABELS = {
  invoice: "Hoá đơn",
  booking: "Đặt lịch",
  referral: "Giới thiệu",
  manual: "Hệ thống",
};

const formatDateTime = (value) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("vi-VN", { hour12: false });
  } catch {
    return value;
  }
};

const formatDeltaPoints = (value) => {
  const numeric = Number(value) || 0;
  const prefix = numeric > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("vi-VN").format(numeric)} di?m`;
};

const LoyaltyWallet = () => {
  const [wallet, setWallet] = useState(INITIAL_WALLET);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        const response = await getPointBalance();
        if (ignore) return;
        const payload = response?.data?.data || {};
        setWallet((prev) => ({
          ...prev,
          balance: Number(payload.balance) || 0,
          updatedAt: payload.updatedAt || prev.updatedAt,
        }));
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch point balance", error);
          toast.error("Không tải được điểm. Vui lòng thử lại!");
        }
      } finally {
        if (!ignore) setLoadingBalance(false);
      }
    };

    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await getPointHistory({ limit: 10 });
        if (ignore) return;
        const payload = response?.data?.data || {};
        setTransactions(payload.items || []);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch point history", error);
          toast.error("Không tải được lịch sử điểm.");
        }
      } finally {
        if (!ignore) setLoadingHistory(false);
      }
    };

    fetchBalance();
    fetchHistory();

    return () => {
      ignore = true;
    };
  }, []);

  const nextRewardProgress = useMemo(() => {
    const threshold = wallet.nextRewardThreshold || 1;
    const current = Math.min(wallet.balance, threshold);
    return Math.round((current / threshold) * 100);
  }, [wallet.balance, wallet.nextRewardThreshold]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-amber-400 text-white p-6 shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest opacity-80">
                Ví điểm MotorMate
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {loadingBalance ? "Dang tai..." : formatPoints(wallet.balance)}
              </h1>
              <p className="text-sm mt-1 opacity-90">
                {wallet.balance >= wallet.nextRewardThreshold
                  ? "Bạn đã đủ điểm để đổi voucher."
                  : `Cần thêm ${formatPoints(
                      Math.max(
                        0,
                        (wallet.nextRewardThreshold || 0) - wallet.balance
                      )
                    )} để nhận quà tiếp theo.`}
              </p>
              {wallet.updatedAt && (
                <p className="text-xs mt-1 opacity-80">
                  Cap nhat {formatDateTime(wallet.updatedAt)}
                </p>
              )}
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/15 px-4 py-2">
                <p className="text-xs uppercase tracking-widest">
                  Tầng thành viên
                </p>
                <p className="text-lg font-semibold">
                  {wallet.tier} • {wallet.tierBenefits}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest">
                    Điểm sắp hết hạn
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPoints(wallet.expiringSoon)}
                  </p>
                  <p className="text-xs opacity-90">
                    Hết hạn vào {wallet.expiringDate}
                  </p>
                </div>
                <Button className="bg-white text-rose-500 hover:bg-white/90">
                  Nhắc tôi
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest mb-2">
              <span>
                Mục tiêu kế tiếp {formatPoints(wallet.nextRewardThreshold)}
              </span>
              <span>{nextRewardProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${nextRewardProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chuỗi check-in
              </CardTitle>
              <Repeat className="size-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{wallet.streakDays} ngày</p>
              <p className="text-sm text-muted-foreground mt-1">
                Giữ chuỗi để nhận quà bất ngờ mỗi 7 ngày.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Voucher đang có
              </CardTitle>
              <TicketCheck className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{wallet.vouchersOwned}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Xem tại mục “Voucher của tôi” khi thanh toán.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bảo mật & an toàn
              </CardTitle>
              <ShieldCheck className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">2 lớp</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mọi điều chỉnh đều lưu audit log. Báo gian lận ngay nếu nghi
                ngờ.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Cách kiếm điểm</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Thực hiện hành động bên dưới để nhận điểm nhanh.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3.5" />
                Auto tracking
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {earningActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border p-4 flex gap-4 hover:border-gray-400 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <action.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {action.title}
                      </p>
                      <Badge variant="outline">{action.points}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Ưu đãi có thể đổi</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chọn quà phù hợp và nhấn “Đổi” khi đủ điểm.
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Gift className="size-4" />
                Lịch sử đổi quà
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {rewardsCatalog.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-2xl border p-4 flex flex-col gap-2 hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reward.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reward.desc}
                      </p>
                    </div>
                    <Badge variant="success">{reward.stock}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatPoints(reward.cost)}
                    </span>
                    <Button size="sm" variant="secondary" className="gap-2">
                      Đổi ngay <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Lịch sử ví điểm</CardTitle>
              <p className="text-sm text-muted-foreground">
                Theo dõi từng giao dịch cộng/trừ điểm kèm kênh thực hiện.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <History className="size-4" />
              Xuất file
            </Button>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Chi tiết</TableHead>
                  <TableHead>Điểm +/-</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Kênh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Đang tải lịch sử ví điểm...
                    </TableCell>
                  </TableRow>
                ) : transactions.length ? (
                  transactions.map((tx) => {
                    const channel =
                      SOURCE_CHANNEL_LABELS[tx?.sourceRef?.kind] ||
                      tx?.metadata?.channel ||
                      tx?.type;
                    const reason = tx?.reason || "Giao dịch";
                    const createdAt = formatDateTime(tx?.createdAt);
                    const balanceAfter =
                      typeof tx?.balanceAfter === "number"
                        ? tx.balanceAfter
                        : wallet.balance;

                    return (
                      <TableRow key={tx._id}>
                        <TableCell className="font-semibold">
                          {tx._id}
                        </TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>
                          <p className="text-sm">{reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {createdAt}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              Number(tx.points) >= 0
                                ? "text-green-600"
                                : "text-rose-600"
                            }`}
                          >
                            {formatDeltaPoints(tx.points)}
                          </span>
                        </TableCell>
                        <TableCell>{formatPoints(balanceAfter)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {channel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Chưa có giao dịch điểm nào. Thực hiện mua hàng hoặc
                      check-in để bắt đầu tích điểm!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Điều kiện & lưu ý</CardTitle>
              <p className="text-sm text-muted-foreground">
                Đảm bảo bạn nắm rõ quyền lợi trước khi đổi điểm.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {reminders.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hỗ trợ & khiếu nại</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gửi yêu cầu nếu thấy giao dịch lạ hoặc không nhận được điểm.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border p-4">
                <p className="text-sm text-muted-foreground">
                  Chuẩn bị các thông tin sau khi liên hệ hỗ trợ:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  <li>• Mã giao dịch hoặc invoice liên quan.</li>
                  <li>• Ảnh chụp màn hình thông báo (nếu có).</li>
                  <li>• Thời gian bạn thực hiện giao dịch.</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="gap-2 flex-1 min-w-[160px]">
                  <Sparkles className="size-4" />
                  Liên hệ hỗ trợ
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-1 min-w-[160px]"
                >
                  <Gift className="size-4" />
                  Chính sách đổi điểm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-rose-100 bg-white">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-rose-500 font-semibold">
                Sẵn sàng cho giao dịch tiếp theo?
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mt-1">
                Tích điểm mọi lúc: thanh toán, check-in, giới thiệu, bảo dưỡng.
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Hãy bật thông báo để không bỏ lỡ điểm thưởng và nhắc nhở hết
                hạn.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2">
                <Wallet className="size-4" />
                Kiểm tra ví điểm
              </Button>
              <Button variant="outline" className="gap-2">
                <Gift className="size-4" />
                Đổi quà ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoyaltyWallet;
