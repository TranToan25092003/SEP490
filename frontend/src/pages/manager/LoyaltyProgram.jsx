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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getManagerLoyaltyOverview,
  getManagerLoyaltyTransactions,
} from "@/api/manager/loyalty";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value ?? 0);
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
const formatPoints = (value) => `${formatNumber(value)} điểm`;

const formatDateTime = (value) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("vi-VN", { hour12: false });
  } catch {
    return value;
  }
};

const formatClerkDisplay = (clerkId) => {
  if (!clerkId) return "Khách vãng lai";
  if (clerkId.length <= 8) return clerkId;
  return `${clerkId.slice(0, 4)}…${clerkId.slice(-4)}`;
};

const formatClerkSubtitle = (clerkId) =>
  clerkId ? `ID: ${clerkId}` : "ID không xác định";

const formatUserEmail = (email) => email || "Chưa cập nhật email";

const normalizeReward = (reward) => {
  if (!reward) return null;
  const delivery =
    reward.discountType === "percentage" ? "Giảm theo %" : "Sinh mã giảm giá";
  const note =
    reward.discountType === "percentage"
      ? `Áp dụng ${reward.value ?? 0}%`
      : `Giảm ${formatCurrency(reward.value ?? 0)}`;
  return {
    id: reward.id,
    reward: reward.title || reward.reward,
    cost: reward.cost,
    delivery,
    stock:
      typeof reward.stock === "number"
        ? `Còn ${reward.stock} mã`
        : "Không giới hạn",
    note,
  };
};

const transformTransaction = (tx) => {
  const profile = tx.memberProfile || {};
  const fallbackEmail =
    tx.metadata?.email ||
    tx.metadata?.customerEmail ||
    tx.metadata?.memberEmail;
  return {
    id: tx._id,
    member: profile.fullName || formatClerkDisplay(tx.clerkId),
    memberSubtitle: formatClerkSubtitle(tx.clerkId),
    email: formatUserEmail(profile.email || fallbackEmail),
    avatar: profile.avatar || tx.metadata?.avatar || null,
    action: tx.reason || tx.type,
    delta: Number(tx.points) || 0,
    balance: Number(tx.balanceAfter) || 0,
    detail: tx.metadata?.note || tx.sourceRef?.refId || "--",
    performedBy: tx.performedBy || "Hệ thống",
    channel: tx.sourceRef?.kind || tx.metadata?.channel || tx.type,
    timestamp: formatDateTime(tx.createdAt),
  };
};

const initialStats = {
  engagedMembers: 0,
  activeMembers: 0,
  totalPoints: 0,
  redeemedPoints: 0,
  expiringSoon: 0,
  campaigns: 0,
};

const HISTORY_SCOPE_OPTIONS = [
  { key: "all", label: "Tất cả" },
  { key: "earn", label: "Tích điểm" },
  { key: "redeem", label: "Quy đổi" },
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
  'Xem ví điểm tại mục "Ví điểm" để biết số dư và hạn sử dụng.',
  "Tích điểm khi thanh toán dịch vụ, check-in, tham gia khuyến mãi.",
  "Giới thiệu bạn bè bằng link/mã riêng, điểm cộng khi đơn đầu hoàn tất.",
  'Đổi điểm trong mục "Đổi quà" để lấy voucher hoặc giảm trực tiếp.',
  "Khi có vấn đề hãy liên hệ hỗ trợ kèm mã giao dịch hoặc ảnh màn hình.",
];

const adminGuide = [
  "Cấu hình tỷ lệ tích điểm, hạn sử dụng và ngưỡng đổi theo chiến dịch.",
  "Theo dõi và lọc giao dịch để duyệt các yêu cầu nghi vấn.",
  "Dùng audit log để kiểm soát mọi điều chỉnh thủ công.",
  "Kết nối automation: gửi email/thông báo khi điểm sắp hết hạn.",
  "Báo cáo tổng điểm theo thời gian, chiến dịch, top người dùng.",
];

const createSimpleRuleForm = () => ({
  voucherQuantity: "",
  voucherDescription: "",
  conversionType: "points",
  conversionValue: "",
  conversionPointsAmount: "",
  conversionCurrencyAmount: "",
  conversionPreviewPoints: "100",
  validFrom: "",
  validTo: "",
  priority: "1",
});

const LoyaltyProgram = () => {
  const [historyScope, setHistoryScope] = useState("all");
  const [stats, setStats] = useState(initialStats);
  const [earningRules, setEarningRules] = useState([]);
  const [redemptionCatalog, setRedemptionCatalog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [transactionsError, setTransactionsError] = useState(null);
  const [ruleForm, setRuleForm] = useState(() => createSimpleRuleForm());
  const [showRuleForm, setShowRuleForm] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadOverview = async () => {
      try {
        setLoadingOverview(true);
        setOverviewError(null);
        const response = await getManagerLoyaltyOverview();
        if (ignore) return;
        const payload = response?.data?.data || {};
        setStats({ ...initialStats, ...(payload.stats || {}) });
        setEarningRules(payload.catalogSummary?.earningRules || []);
        const rewards =
          (payload.catalogSummary?.rewards || [])
            .map(normalizeReward)
            .filter(Boolean) || [];
        setRedemptionCatalog(rewards);
        setLeaderboard(payload.leaderboard || []);
      } catch (error) {
        if (!ignore) {
          setOverviewError(
            error?.response?.data?.message ||
              error?.message ||
              "Không thể tải dữ liệu tổng quan."
          );
        }
      } finally {
        if (!ignore) setLoadingOverview(false);
      }
    };

    loadOverview();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        setTransactionsError(null);
        const params =
          historyScope === "all"
            ? { limit: 20 }
            : { limit: 20, type: historyScope };
        const response = await getManagerLoyaltyTransactions(params);
        if (ignore) return;
        const payload = response?.data?.data || [];
        setTransactions(payload.map(transformTransaction));
      } catch (error) {
        if (!ignore) {
          setTransactionsError(
            error?.response?.data?.message ||
              error?.message ||
              "Không thể tải lịch sử giao dịch."
          );
          setTransactions([]);
        }
      } finally {
        if (!ignore) setLoadingTransactions(false);
      }
    };

    loadTransactions();
    return () => {
      ignore = true;
    };
  }, [historyScope]);

  const handleRuleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setRuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRuleFieldDirectChange = (field, value) => {
    setRuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyQuickConversion = () => {
    setRuleForm((prev) => ({
      ...prev,
      conversionType: "points",
      conversionValue: "",
      conversionPointsAmount: "1",
      conversionCurrencyAmount: "100",
      conversionPreviewPoints: prev.conversionPreviewPoints || "100",
    }));
  };

  const handleRuleDateChange = (field) => (event) => {
    const { value } = event.target;
    setRuleForm((prev) => {
      if (field === "validTo" && value && prev.validFrom) {
        const startDate = new Date(`${prev.validFrom}T00:00:00Z`);
        const endDate = new Date(`${value}T00:00:00Z`);
        if (endDate <= startDate) {
          return prev;
        }
      }
      if (field === "validFrom") {
        const nextState = { ...prev, validFrom: value };
        if (
          nextState.validTo &&
          value &&
          new Date(`${nextState.validTo}T00:00:00Z`) <=
            new Date(`${value}T00:00:00Z`)
        ) {
          nextState.validTo = "";
        }
        return nextState;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleRuleFormSubmit = (event) => {
    event.preventDefault();
    console.log("Rule draft", ruleForm);
  };

  const handleResetRuleForm = () => {
    setRuleForm(createSimpleRuleForm());
  };

  const minValidTo = useMemo(() => {
    if (!ruleForm.validFrom) return undefined;
    const base = new Date(`${ruleForm.validFrom}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString().split("T")[0];
  }, [ruleForm.validFrom]);

  const conversionPreviewCurrency = useMemo(() => {
    if (ruleForm.conversionType !== "points") return null;
    const previewPoints = Number(ruleForm.conversionPreviewPoints);
    const pointUnit = Number(ruleForm.conversionPointsAmount);
    const currencyUnit = Number(ruleForm.conversionCurrencyAmount);
    if (
      !previewPoints ||
      !pointUnit ||
      !currencyUnit ||
      Number.isNaN(previewPoints) ||
      Number.isNaN(pointUnit) ||
      Number.isNaN(currencyUnit)
    ) {
      return null;
    }
    const value = (previewPoints / pointUnit) * currencyUnit;
    if (!Number.isFinite(value)) return null;
    return Math.round(value);
  }, [
    ruleForm.conversionType,
    ruleForm.conversionPointsAmount,
    ruleForm.conversionCurrencyAmount,
    ruleForm.conversionPreviewPoints,
  ]);

  const conversionSummaryText = useMemo(() => {
    if (ruleForm.conversionType === "percent") {
      return ruleForm.conversionValue
        ? `${ruleForm.conversionValue}%`
        : "Chưa nhập";
    }
    if (ruleForm.conversionPointsAmount && ruleForm.conversionCurrencyAmount) {
      const currencyValue = formatCurrency(
        Number(ruleForm.conversionCurrencyAmount) || 0
      );
      return `${ruleForm.conversionPointsAmount} điểm ≈ ${currencyValue}`;
    }
    return "Chưa nhập";
  }, [
    ruleForm.conversionType,
    ruleForm.conversionValue,
    ruleForm.conversionPointsAmount,
    ruleForm.conversionCurrencyAmount,
  ]);

  const filteredHistory = useMemo(() => transactions, [transactions]);

  const expiringPercentage = useMemo(() => {
    if (!stats.totalPoints) return 0;
    return Math.min(
      Math.round((stats.expiringSoon / stats.totalPoints) * 100),
      100
    );
  }, [stats.expiringSoon, stats.totalPoints]);

  const showInitialLoading = loadingOverview && !overviewError;

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
          <Button
            className="gap-2"
            onClick={() => setShowRuleForm((prev) => !prev)}
          >
            <Settings className="size-4" />
            {showRuleForm ? "Ẩn form" : "Cấu hình quy tắc"}
          </Button>
        </div>
      </div>

      {showInitialLoading && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3 text-sm text-muted-foreground">
          Đang tải dữ liệu chương trình loyalty...
        </div>
      )}
      {overviewError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {overviewError}
        </div>
      )}

      {showRuleForm && (
        <Card className="border-primary/20 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle>Cấu hình nhanh quy tắc</CardTitle>
            <p className="text-sm text-muted-foreground">
              Chỉ nhập những trường quan trọng: số lượng voucher, tỉ lệ quy đổi,
              thời gian áp dụng và mức ưu tiên.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRuleFormSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voucherQuantity">Số lượng voucher</Label>
                    <Input
                      id="voucherQuantity"
                      type="number"
                      min="0"
                      placeholder="Ví dụ: 100"
                      value={ruleForm.voucherQuantity}
                      onChange={handleRuleFieldChange("voucherQuantity")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherDescription">Mô tả voucher</Label>
                    <Textarea
                      id="voucherDescription"
                      rows={3}
                      placeholder="Ví dụ: Voucher giảm 100k cho gói bảo dưỡng chuẩn."
                      value={ruleForm.voucherDescription}
                      onChange={handleRuleFieldChange("voucherDescription")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ghi chú ngắn gọn để team marketing/CSKH hiểu cách áp dụng.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hình thức quy đổi</Label>
                    <Select
                      value={ruleForm.conversionType}
                      onValueChange={(value) =>
                        handleRuleFieldDirectChange("conversionType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Điểm cố định</SelectItem>
                        <SelectItem value="percent">Phần trăm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {ruleForm.conversionType === "percent" ? (
                    <div className="space-y-2">
                      <Label htmlFor="conversionPercent">
                        Tỉ lệ % thưởng thêm
                      </Label>
                      <div className="relative">
                        <Input
                          id="conversionPercent"
                          type="number"
                          min="0"
                          step="0.1"
                          className="pr-14"
                          placeholder="Ví dụ: 5"
                          value={ruleForm.conversionValue}
                          onChange={handleRuleFieldChange("conversionValue")}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nhập phần trăm thưởng thêm so với giao dịch gốc.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="conversionPointsAmount">
                            Điểm cơ sở
                          </Label>
                          <Input
                            id="conversionPointsAmount"
                            type="number"
                            min="1"
                            placeholder="Ví dụ: 1"
                            value={ruleForm.conversionPointsAmount}
                            onChange={handleRuleFieldChange(
                              "conversionPointsAmount"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="conversionCurrencyAmount">
                            Tương ứng (VNĐ)
                          </Label>
                          <Input
                            id="conversionCurrencyAmount"
                            type="number"
                            min="0"
                            placeholder="Ví dụ: 100"
                            value={ruleForm.conversionCurrencyAmount}
                            onChange={handleRuleFieldChange(
                              "conversionCurrencyAmount"
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conversionPreviewPoints">
                          Với số điểm này thì được bao nhiêu tiền?
                        </Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            id="conversionPreviewPoints"
                            type="number"
                            min="0"
                            placeholder="Ví dụ: 100"
                            value={ruleForm.conversionPreviewPoints}
                            onChange={handleRuleFieldChange(
                              "conversionPreviewPoints"
                            )}
                          />
                          <div className="flex items-center rounded-md border bg-muted/50 px-3 text-sm font-medium">
                            {conversionPreviewCurrency !== null
                              ? formatCurrency(conversionPreviewCurrency)
                              : "Nhập đủ để xem"}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ruleForm.conversionPointsAmount || "?"} điểm tương
                          đương số tiền VNĐ ở trên.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Quick convert
                        </p>
                        <p>1 điểm = 100 đồng (mặc định chương trình)</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleApplyQuickConversion}
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Áp dụng từ ngày</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={ruleForm.validFrom}
                    onChange={handleRuleDateChange("validFrom")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Đến ngày</Label>
                  <Input
                    id="validTo"
                    type="date"
                    min={minValidTo}
                    value={ruleForm.validTo}
                    onChange={handleRuleDateChange("validTo")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Ưu tiên (số càng nhỏ càng áp dụng trước)
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={ruleForm.priority}
                    onChange={handleRuleFieldChange("priority")}
                  />
                </div>
                <div className="rounded-lg border bg-muted/10 p-3 text-sm text-muted-foreground">
                  <p>
                    Thời gian áp dụng: {ruleForm.validFrom || "..."} →{" "}
                    {ruleForm.validTo || "..."}
                  </p>
                  <p>
                    Tỉ lệ:{" "}
                    {ruleForm.conversionType === "percent"
                      ? ruleForm.conversionValue
                        ? `${ruleForm.conversionValue}%`
                        : "Chưa nhập"
                      : ruleForm.conversionValue || "Chưa nhập"}{" "}
                    • Số voucher: {ruleForm.voucherQuantity || "Chưa nhập"}
                  </p>
                  <p>Mô tả: {ruleForm.voucherDescription || "Chưa cập nhật"}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetRuleForm}
                >
                  Xóa dữ liệu
                </Button>
                <Button type="submit" className="gap-2">
                  <Sparkles className="size-4" />
                  Lưu cấu hình nháp
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
            {earningRules.length ? (
              earningRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border p-4 hover:border-gray-400 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {rule.title}
                      </p>
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
                      <p className="text-xs text-green-600 mt-1">
                        {rule.bonus}
                      </p>
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
                      <p className="font-medium text-gray-900">
                        {rule.channel}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có quy tắc tích điểm nào được cấu hình.
              </p>
            )}
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
              {leaderboard.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <p className="text-xs uppercase text-muted-foreground">
                      Top khách hàng theo điểm
                    </p>
                    {leaderboard.map((member) => (
                      <div
                        key={member.clerkId}
                        className="flex items-center justify-between rounded border px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">
                            {formatClerkDisplay(member.clerkId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatClerkSubtitle(member.clerkId)}
                          </p>
                        </div>
                        <span className="text-muted-foreground">
                          {formatPoints(member.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
              {redemptionCatalog.length ? (
                redemptionCatalog.map((reward) => (
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
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có ưu đãi nào trong danh sách đổi thưởng.
                </p>
              )}
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
                Theo dõi từng giao dịch cộng/trừ điểm kèm lý do, người thực
                hiện.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Hiển thị</span>
              <div className="inline-flex rounded-full border bg-muted/40 p-1">
                {HISTORY_SCOPE_OPTIONS.map((option) => (
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
              {transactionsError && (
                <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {transactionsError}
                </div>
              )}
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
                  {loadingTransactions ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Đang tải lịch sử giao dịch...
                      </TableCell>
                    </TableRow>
                  ) : filteredHistory.length ? (
                    filteredHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          {item.id}
                          <p className="text-xs text-muted-foreground">
                            {item.timestamp}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {item.avatar ? (
                                <AvatarImage
                                  src={item.avatar}
                                  alt={item.member}
                                />
                              ) : null}
                              <AvatarFallback>
                                {item.member?.slice(0, 2)?.toUpperCase() ||
                                  "KH"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{item.member}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.action}</TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              item.delta > 0
                                ? "text-green-600"
                                : "text-rose-600"
                            }`}
                          >
                            {item.delta > 0 ? "+" : "-"}
                            {formatNumber(Math.abs(item.delta))} điểm
                          </span>
                        </TableCell>
                        <TableCell>{formatPoints(item.balance)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{item.detail}</p>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        {transactionsError ||
                          "Chưa có giao dịch nào trong phạm vi lựa chọn."}
                      </TableCell>
                    </TableRow>
                  )}
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
