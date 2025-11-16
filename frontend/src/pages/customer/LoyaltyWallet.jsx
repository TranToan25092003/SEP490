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
import { getPointBalance, getPointHistory, redeemVoucher } from "@/api/loyalty";

const formatPoints = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)} điểm`;
const formatCurrency = (value, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);

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
  vouchers: [],
};

const earningActions = [
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
];

const normalizeReward = (reward) => {
  if (!reward) return null;
  const cost = Number(reward.cost) || 0;
  if (!reward.id || cost <= 0) return null;
  let stockLabel = "Không giới hạn";
  if (typeof reward.remainingStock === "number") {
    stockLabel =
      reward.remainingStock > 0
        ? `Còn ${new Intl.NumberFormat("vi-VN").format(
            reward.remainingStock
          )} mã`
        : "Đã hết mã";
  } else if (typeof reward.stock === "number") {
    stockLabel = `Giới hạn ${new Intl.NumberFormat("vi-VN").format(
      reward.stock
    )} mã`;
  } else if (typeof reward.stock === "string") {
    stockLabel = reward.stock;
  }

  return {
    id: reward.id,
    title: reward.title || reward.name || "Voucher",
    cost,
    desc: reward.description || reward.voucherDescription || "Ưu đãi đặc biệt.",
    value: Number(reward.value) || 0,
    currency: reward.currency || "VND",
    discountType: reward.discountType || "fixed",
    stockLabel,
  };
};

const normalizeOwnedVoucher = (voucher) => {
  if (!voucher) return null;
  const normalized = {
    id: voucher.id || voucher._id || voucher.voucherCode,
    code: voucher.code || voucher.voucherCode || "N/A",
    rewardName:
      voucher.rewardName || voucher.reward?.title || voucher.title || "Voucher",
    status: voucher.status || "active",
    pointsCost:
      typeof voucher.pointsCost === "number"
        ? voucher.pointsCost
        : Number(voucher.cost || voucher.points_cost || 0),
    value:
      typeof voucher.value === "number"
        ? voucher.value
        : Number(voucher.voucherValue || 0),
    currency: voucher.currency || voucher.voucherCurrency || "VND",
    discountType: voucher.discountType || "fixed",
    issuedAt: voucher.issuedAt || voucher.createdAt || null,
    expiresAt: voucher.expiresAt || voucher.voucherExpiresAt || null,
    redeemedAt: voucher.redeemedAt || null,
  };
  return normalized;
};

const VOUCHER_STATUS_LABELS = {
  active: "Có thể dùng",
  used: "Đã dùng",
  expired: "Hết hạn",
  cancelled: "Đã hủy",
};

const VOUCHER_STATUS_VARIANTS = {
  active: "success",
  used: "secondary",
  expired: "destructive",
  cancelled: "outline",
};

const formatVoucherValue = (voucher = {}) => {
  if (voucher.discountType === "percentage") {
    return `${voucher.value || 0}%`;
  }
  return formatCurrency(voucher.value || 0, voucher.currency || "VND");
};

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
  return `${prefix}${new Intl.NumberFormat("vi-VN").format(numeric)} điểm`;
};

const LoyaltyWallet = () => {
  const [wallet, setWallet] = useState(INITIAL_WALLET);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [redeemingRewardId, setRedeemingRewardId] = useState(null);
  const [rewardsCatalog, setRewardsCatalog] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        setLoadingRewards(true);
        const response = await getPointBalance();

        if (ignore) return;
        const payload = response?.data?.data || {};
        const normalizedRewards = Array.isArray(payload.catalog?.rewards)
          ? payload.catalog.rewards.map(normalizeReward).filter(Boolean)
          : [];
        const normalizedOwnedVouchers = Array.isArray(payload.vouchers)
          ? payload.vouchers.map(normalizeOwnedVoucher).filter(Boolean)
          : null;
        setRewardsCatalog(normalizedRewards);
        setWallet((prev) => ({
          ...prev,
          balance:
            Number(payload.balance ?? payload.total_points ?? prev.balance) ||
            0,
          updatedAt: payload.updatedAt || prev.updatedAt,
          tier: payload.tier || prev.tier,
          tierBenefits: payload.tierBenefits || prev.tierBenefits,
          nextRewardThreshold:
            Number(payload.nextRewardThreshold) || prev.nextRewardThreshold,
          vouchersOwned:
            typeof payload.vouchersOwned === "number"
              ? payload.vouchersOwned
              : prev.vouchersOwned,
          vouchers:
            normalizedOwnedVouchers !== null
              ? normalizedOwnedVouchers
              : prev.vouchers,
        }));
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch point balance", error);
          toast.error("Không tải được điểm. Vui lòng thử lại!");
          setRewardsCatalog([]);
        }
      } finally {
        if (!ignore) {
          setLoadingBalance(false);
          setLoadingRewards(false);
        }
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

  const handleRedeemReward = async (reward) => {
    if (!reward) return;

    if ((Number(wallet.balance) || 0) < reward.cost) {
      toast.error("Bạn chưa đủ điểm để đổi ưu đãi này.");
      return;
    }

    try {
      setRedeemingRewardId(reward.id);
      const response = await redeemVoucher({ rewardId: reward.id });
      const payload = response?.data?.data || {};
      const updatedWallet = payload.wallet || {};
      const newTransaction = payload.transaction;
      const voucher = payload.voucher;
      const normalizedReward = normalizeReward(payload.reward);
      const mintedVoucher = normalizeOwnedVoucher({
        ...voucher,
        rewardName:
          voucher?.rewardName || normalizedReward?.title || reward.title,
        pointsCost:
          typeof voucher?.pointsCost === "number"
            ? voucher.pointsCost
            : reward.cost,
      });

      setWallet((prev) => ({
        ...prev,
        balance:
          Number(
            updatedWallet.balance ?? updatedWallet.total_points ?? prev.balance
          ) || Math.max(0, (Number(prev.balance) || 0) - reward.cost),
        updatedAt:
          updatedWallet.updatedAt || updatedWallet.updated_at || prev.updatedAt,
        vouchersOwned:
          typeof updatedWallet.vouchersOwned === "number"
            ? updatedWallet.vouchersOwned
            : (prev.vouchersOwned || 0) + 1,
        tier: updatedWallet.tier || prev.tier,
        tierBenefits: updatedWallet.tierBenefits || prev.tierBenefits,
        nextRewardThreshold:
          Number(updatedWallet.nextRewardThreshold) || prev.nextRewardThreshold,
        vouchers: mintedVoucher
          ? [mintedVoucher, ...(prev.vouchers || [])].slice(0, 25)
          : prev.vouchers,
      }));

      if (newTransaction) {
        setTransactions((prev) =>
          [newTransaction, ...(prev || [])].slice(0, 10)
        );
      }

      if (normalizedReward) {
        setRewardsCatalog((prev) => {
          const index = prev.findIndex(
            (item) => item.id === normalizedReward.id
          );
          if (index === -1) {
            return [...prev, normalizedReward];
          }
          const next = [...prev];
          next[index] = normalizedReward;
          return next;
        });
      }

      const voucherCode = voucher?.voucherCode;
      const rewardLabel = normalizedReward?.title || reward.title;
      toast.success(
        voucherCode
          ? `Đổi ${rewardLabel} thành công. Mã voucher: ${voucherCode}`
          : `Đổi ${rewardLabel} thành công.`
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Đổi voucher thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setRedeemingRewardId(null);
    }
  };

  const displayedRewards = useMemo(
    () => (Array.isArray(rewardsCatalog) ? rewardsCatalog : []),
    [rewardsCatalog]
  );

  const ownedVouchers = useMemo(
    () => (Array.isArray(wallet.vouchers) ? wallet.vouchers : []),
    [wallet.vouchers]
  );

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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* <Card>
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
          </Card> */}
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

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Voucher của tôi</CardTitle>
              <p className="text-sm text-muted-foreground">
                Theo dõi mã, trạng thái và hạn sử dụng của các voucher đã đổi.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TicketCheck className="size-3.5" />
              {ownedVouchers.length} mã
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingBalance ? (
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách voucher...
              </p>
            ) : !ownedVouchers.length ? (
              <p className="text-sm text-muted-foreground">
                Bạn chưa có voucher nào. Hãy đổi điểm để nhận ưu đãi.
              </p>
            ) : (
              ownedVouchers.map((voucher) => (
                <div
                  key={voucher.id || voucher.code}
                  className="rounded-2xl border p-4 transition hover:border-gray-400 bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {voucher.rewardName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mã: <span className="font-mono">{voucher.code}</span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        VOUCHER_STATUS_VARIANTS[voucher.status] || "outline"
                      }
                    >
                      {VOUCHER_STATUS_LABELS[voucher.status] || voucher.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Giá trị
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatVoucherValue(voucher)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Điểm đã đổi
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatPoints(voucher.pointsCost || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Hạn sử dụng
                      </p>
                      <p className="font-medium text-gray-900">
                        {voucher.expiresAt
                          ? formatDateTime(voucher.expiresAt)
                          : "Không thời hạn"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>
                      Đổi ngày:{" "}
                      {voucher.issuedAt
                        ? formatDateTime(voucher.issuedAt)
                        : "Không rõ"}
                    </p>
                    {voucher.status === "used" && voucher.redeemedAt && (
                      <p>Đã dùng: {formatDateTime(voucher.redeemedAt)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
              {loadingRewards ? (
                <p className="text-sm text-muted-foreground">
                  Đang tải danh sách ưu đãi...
                </p>
              ) : !displayedRewards.length ? (
                <p className="text-sm text-muted-foreground">
                  Hiện chưa có voucher khả dụng. Vui lòng quay lại sau.
                </p>
              ) : (
                displayedRewards.map((reward) => {
                  const currentBalance = Number(wallet.balance) || 0;
                  const canRedeem = currentBalance >= reward.cost;
                  const neededPoints = Math.max(
                    0,
                    reward.cost - currentBalance
                  );
                  const rewardValueLabel =
                    reward.discountType === "percentage"
                      ? `${reward.value || 0}%`
                      : `${formatCurrency(
                          (reward.value || 0) * (reward.cost || 1),
                          reward.currency || "VND"
                        )}`;

                  return (
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
                          <p className="text-xs text-muted-foreground">
                            Giá trị: {rewardValueLabel}
                          </p>
                        </div>
                        <Badge variant="success">
                          {reward.stockLabel ||
                            reward.stock ||
                            "Không giới hạn"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {formatPoints(reward.cost)}
                        </span>
                        <Button
                          size="sm"
                          variant={canRedeem ? "secondary" : "outline"}
                          className="gap-2"
                          disabled={
                            loadingRewards ||
                            !canRedeem ||
                            redeemingRewardId === reward.id
                          }
                          onClick={() => handleRedeemReward(reward)}
                        >
                          {redeemingRewardId === reward.id
                            ? "Đang đổi..."
                            : "Đổi ngay"}
                          <ArrowUpRight className="size-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {canRedeem
                          ? "Bạn đã đủ điểm để đổi ưu đãi."
                          : `Cần thêm ${formatPoints(
                              neededPoints
                            )} để đổi ưu đãi.`}
                      </p>
                    </div>
                  );
                })
              )}
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
      </div>
    </div>
  );
};

export default LoyaltyWallet;
