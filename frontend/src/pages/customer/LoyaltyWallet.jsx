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
import background from "@/assets/cool-motorcycle-indoors.png";
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
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      {/* Main Card Wrapper */}
      <Card className="w-full max-w-6xl shadow-lg rounded-2xl overflow-hidden bg-gray-50/95 backdrop-blur-sm">

        {/* 1. Header Section (Gradient Card) */}
        <div className="p-6">
          <div className="rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-amber-400 text-white p-6 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest opacity-80">
                  Ví điểm MotorMate
                </p>
                <h1 className="mt-2 text-4xl font-bold">
                  {loadingBalance ? "Đang tải..." : formatPoints(wallet.balance)}
                </h1>
                <p className="text-sm mt-2 opacity-90 font-medium">
                  {wallet.balance >= wallet.nextRewardThreshold
                    ? "Bạn đã đủ điểm để đổi voucher!"
                    : `Cần thêm ${formatPoints(
                      Math.max(
                        0,
                        (wallet.nextRewardThreshold || 0) - wallet.balance
                      )
                    )} điểm để nhận quà tiếp theo.`}
                </p>
                {wallet.updatedAt && (
                  <p className="text-xs mt-1 opacity-70">
                    Cập nhật: {formatDateTime(wallet.updatedAt)}
                  </p>
                )}
              </div>
              {/* Stats in Header */}
              <div className="flex gap-4">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px]">
                  <p className="text-2xl font-bold">{wallet.vouchersOwned}</p>
                  <p className="text-xs uppercase opacity-80">Voucher</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px]">
                  <p className="text-2xl font-bold">{wallet.streakDays} <span className="text-sm font-normal">ngày</span></p>
                  <p className="text-xs uppercase opacity-80">Chuỗi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 pt-0 space-y-8">

          {/* 2. Voucher của tôi & Ưu đãi (Grid Layout) */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Cột Trái: Voucher của tôi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <TicketCheck className="size-5 text-red-500" /> Voucher của tôi
                </h2>
                <Badge variant="secondary">{ownedVouchers.length} mã</Badge>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {loadingBalance ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>
                ) : !ownedVouchers.length ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl border-gray-300">
                    <p className="text-gray-500">Bạn chưa có voucher nào.</p>
                  </div>
                ) : (
                  ownedVouchers.map((voucher) => (
                    <div key={voucher.id || voucher.code} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{voucher.rewardName}</p>
                          <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">{voucher.code}</p>
                        </div>
                        <Badge variant={VOUCHER_STATUS_VARIANTS[voucher.status] || "outline"}>
                          {VOUCHER_STATUS_LABELS[voucher.status] || voucher.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end text-sm mt-3">
                        <div>
                          <p className="text-gray-500 text-xs">Giá trị</p>
                          <p className="font-semibold">{formatVoucherValue(voucher)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">Hết hạn</p>
                          <p className="font-medium">{voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString('vi-VN') : "Vô thời hạn"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cột Phải: Ưu đãi đổi điểm */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Gift className="size-5 text-amber-500" /> Đổi quà
                </h2>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {loadingRewards ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Đang tải ưu đãi...</p>
                ) : !displayedRewards.length ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl border-gray-300">
                    <p className="text-gray-500">Chưa có ưu đãi nào.</p>
                  </div>
                ) : (
                  displayedRewards.map((reward) => {
                    const currentBalance = Number(wallet.balance) || 0;
                    const canRedeem = currentBalance >= reward.cost;

                    return (
                      <div key={reward.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900">{reward.title}</p>
                            {/* <Badge variant="outline" className="text-[10px] h-5">Stock: {reward.stock}</Badge> */}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{reward.desc}</p>
                          <p className="text-sm font-semibold text-red-600 mt-1">{formatPoints(reward.cost)} điểm</p>
                        </div>
                        <Button
                          size="sm"
                          variant={canRedeem ? "default" : "outline"}
                          className={canRedeem ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                          disabled={loadingRewards || !canRedeem || redeemingRewardId === reward.id}
                          onClick={() => handleRedeemReward(reward)}
                        >
                          {redeemingRewardId === reward.id ? <Loader2 className="animate-spin h-4 w-4" /> : "Đổi"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 3. Cách kiếm điểm */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-yellow-500" /> Cách kiếm điểm
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {earningActions.map((action) => (
                <div
                  key={action.id}
                  className="flex flex-col items-center text-center p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all"
                >
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                    <action.icon className="size-5" />
                  </div>

                  {/* Title */}
                  <p className="font-semibold text-sm">{action.title}</p>

                  {/* Description */}
                  <p className="text-xs text-gray-500 mt-1 px-1 leading-snug">
                    {action.desc}
                  </p>

                  {/* Badge */}
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-green-100 text-green-700 hover:bg-green-100"
                  >
                    {action.points}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Lịch sử giao dịch */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History className="size-5 text-gray-600" /> Lịch sử giao dịch
              </h2>
              <Button variant="ghost" size="sm" className="text-gray-500">Xuất file</Button>
            </div>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hoạt động</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                    <TableHead className="text-right">Số dư</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">Đang tải lịch sử...</TableCell>
                    </TableRow>
                  ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell className="text-gray-500">{formatDateTime(tx.createdAt)}</TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900">{tx.reason}</p>
                          <Badge variant="outline" className="text-[10px] mt-1 scale-90 origin-left opacity-70">{SOURCE_CHANNEL_LABELS[tx?.sourceRef?.kind] || 'Hệ thống'}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${Number(tx.points) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatDeltaPoints(tx.points)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">{formatPoints(tx.balanceAfter ?? wallet.balance)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">Chưa có giao dịch nào.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyWallet;
