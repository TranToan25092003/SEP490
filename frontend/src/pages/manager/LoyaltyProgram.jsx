import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Pencil,
  Search,
  Repeat,
  X,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createLoyaltyRule,
  deleteLoyaltyRule,
  getManagerLoyaltyAudits,
  getManagerLoyaltyOverview,
  getManagerLoyaltyTransactions,
  listLoyaltyRules,
  updateLoyaltyRule,
  updateLoyaltyRuleStatus,
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
    reward.discountType === "percentage"
      ? "Gi???m theo %"
      : "Sinh mA? gi???m giA?";
  const note =
    reward.discountType === "percentage"
      ? `A?p d???ng ${reward.value ?? 0}%`
      : `Gi???m ${formatCurrency(reward.value ?? 0)}`;
  const costPoints = Number(reward.cost);
  const shouldShowCost =
    reward.discountType === "percentage" &&
    Number.isFinite(costPoints) &&
    costPoints > 0;
  const normalizedNote = shouldShowCost
    ? `${note} (chi phi ${formatPoints(costPoints)})`
    : note;
  let stockLabel = "không giới hạn";
  if (typeof reward.remainingStock === "number") {
    stockLabel =
      reward.remainingStock > 0
        ? `C??n ${formatNumber(reward.remainingStock)} mA?`
        : "??A? h???t mA??";
  } else if (typeof reward.stock === "number") {
    stockLabel = `Giới hạn ${formatNumber(reward.stock)} mã`;
  } else if (typeof reward.stock === "string") {
    stockLabel = reward.stock;
  }
  return {
    id: reward.id,
    reward: reward.title || reward.reward,
    cost: reward.cost,
    delivery,
    stock: stockLabel,
    note: normalizedNote,
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

const createSimpleRuleForm = () => ({
  voucherQuantity: "",
  voucherDescription: "",
  voucherValidityDays: "60",
  conversionType: "points",
  conversionValue: "",
  conversionPointsAmount: "",
  conversionCurrencyAmount: "",
  conversionPreviewPoints: "100",
  validFrom: "",
  validTo: "",
  priority: "1",
});

const buildRulePayload = (formValues) => {
  const nameSource = formValues.voucherDescription?.trim();
  const fallbackName = `Quy tắc ngày ${new Date().toLocaleDateString("vi-VN")}`;
  const isPercent = formValues.conversionType === "percent";
  return {
    name: nameSource || fallbackName,
    description: formValues.voucherDescription || "Rule đơn giản",
    voucherDescription: formValues.voucherDescription || "",
    voucherQuantity: Number(formValues.voucherQuantity) || 0,
    voucherValidityDays:
      Number(formValues.voucherValidityDays) > 0
        ? Number(formValues.voucherValidityDays)
        : 60,
    conversionType: formValues.conversionType,
    conversionValue: isPercent ? Number(formValues.conversionValue) || 0 : 0,
    conversionPointsAmount: !isPercent
      ? Number(formValues.conversionPointsAmount) || 1
      : 0,
    conversionCurrencyAmount: !isPercent
      ? Number(formValues.conversionCurrencyAmount) || 0
      : 0,
    conversionPreviewPoints: Number(formValues.conversionPreviewPoints) || 0,
    validFrom: formValues.validFrom || null,
    validTo: formValues.validTo || null,
    priority: Number(formValues.priority) || 1,
    status: "draft",
  };
};

const transformRuleRecord = (rule) => {
  const formatDate = (value) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return null;
    }
  };

  const expiry = formatDate(rule.validTo) || "Không";
  const start = formatDate(rule.validFrom);
  const end = formatDate(rule.validTo);
  const schedule =
    start && end
      ? `${start} → ${end}`
      : start
      ? `Từ ${start}`
      : "Không giới hạn";
  const ratio =
    rule.conversionType === "percent"
      ? `${rule.conversionValue ?? 0}% thưởng`
      : `${formatNumber(
          rule.conversionPointsAmount || 1
        )} điểm ≈ ${formatCurrency(rule.conversionCurrencyAmount || 0)}`;

  return {
    id: rule._id || rule.id,
    title: rule.name || "Quy tắc chưa đặt tên",
    channel: `Trạng thái: ${rule.status || "chưa rõ"} • Ưu tiên ${
      rule.priority || 1
    }`,
    expiry,
    ratio,
    bonus: rule.voucherDescription || rule.description || "Không có mô tả",
    limit: rule.voucherQuantity
      ? `${formatNumber(rule.voucherQuantity)} voucher khả dụng`
      : "Không giới hạn",
    schedule,
    status: rule.status || "draft",
  };
};

const mapRuleToFormValues = (rule) => {
  const toInputDate = (value) => {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };
  return {
    voucherQuantity:
      rule.voucherQuantity === null || rule.voucherQuantity === undefined
        ? ""
        : String(rule.voucherQuantity),
    voucherValidityDays: String(rule.voucherValidityDays ?? "60"),
    voucherDescription: rule.voucherDescription || rule.description || "",
    conversionType: rule.conversionType || "points",
    conversionValue:
      rule.conversionType === "percent"
        ? String(rule.conversionValue ?? "")
        : "",
    conversionPointsAmount:
      rule.conversionType !== "percent"
        ? String(rule.conversionPointsAmount ?? "")
        : "",
    conversionCurrencyAmount:
      rule.conversionType !== "percent"
        ? String(rule.conversionCurrencyAmount ?? "")
        : "",
    conversionPreviewPoints: String(rule.conversionPreviewPoints ?? "100"),
    validFrom: toInputDate(rule.validFrom),
    validTo: toInputDate(rule.validTo),
    priority: String(rule.priority ?? "1"),
  };
};

const LoyaltyProgram = () => {
  const [historyScope, setHistoryScope] = useState("all");
  const [stats, setStats] = useState(initialStats);
  const [earningRules, setEarningRules] = useState([]);
  const [rawRules, setRawRules] = useState([]);
  const [redemptionCatalog, setRedemptionCatalog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [transactionsError, setTransactionsError] = useState(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState(null);
  const [ruleForm, setRuleForm] = useState(() => createSimpleRuleForm());
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [ruleSubmitMessage, setRuleSubmitMessage] = useState("");
  const [ruleSubmitError, setRuleSubmitError] = useState("");
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleStatusMessage, setRuleStatusMessage] = useState("");
  const [ruleStatusError, setRuleStatusError] = useState("");
  const [ruleDeleteMessage, setRuleDeleteMessage] = useState("");
  const [ruleDeleteError, setRuleDeleteError] = useState("");
  const [updatingRuleId, setUpdatingRuleId] = useState(null);
  const [deletingRuleId, setDeletingRuleId] = useState(null);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  const fetchRules = useCallback(async () => {
    try {
      setLoadingRules(true);
      setRulesError(null);
      const response = await listLoyaltyRules({
        limit: 20,
        sortBy: "priority",
        sortOrder: "asc",
      });
      const items = response?.data?.data?.items || [];
      setRawRules(items);
      setEarningRules(items.map(transformRuleRecord));
    } catch (error) {
      setRulesError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách quy tắc."
      );
      setRawRules([]);
      setEarningRules([]);
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const handleRuleStatusChange = async (ruleId, nextStatus) => {
    setRuleStatusMessage("");
    setRuleStatusError("");
    setUpdatingRuleId(ruleId);
    try {
      await updateLoyaltyRuleStatus(ruleId, { status: nextStatus });
      setRuleStatusMessage(
        nextStatus === "active"
          ? "Đã bật quy tắc."
          : nextStatus === "inactive"
          ? "Đã tắt quy tắc."
          : "Đã cập nhật trạng thái."
      );
      await fetchRules();
    } catch (error) {
      setRuleStatusError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật trạng thái."
      );
    } finally {
      setUpdatingRuleId(null);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Bạn có chắc muốn xoá quy tắc này?")
    ) {
      return;
    }
    clearRuleFeedback();
    setDeletingRuleId(ruleId);
    try {
      await deleteLoyaltyRule(ruleId);
      setRuleDeleteMessage("Đã xoá quy tắc.");
      if (editingRuleId === ruleId) {
        setEditingRuleId(null);
        setRuleForm(createSimpleRuleForm());
      }
      await fetchRules();
    } catch (error) {
      setRuleDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể xoá quy tắc."
      );
    } finally {
      setDeletingRuleId(null);
    }
  };

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

  useEffect(() => {
    let ignore = false;

    const loadAudits = async () => {
      try {
        setLoadingAudits(true);
        setAuditError(null);
        const response = await getManagerLoyaltyAudits({ limit: 30 });
        if (ignore) return;
        const payload = response?.data?.data;
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];
        setAuditLogs(items);
      } catch (error) {
        if (!ignore) {
          setAuditError(
            error?.response?.data?.message ||
              error?.message ||
              "Không thể tải audit log."
          );
          setAuditLogs([]);
        }
      } finally {
        if (!ignore) setLoadingAudits(false);
      }
    };

    loadAudits();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const clearRuleFeedback = () => {
    setRuleSubmitMessage("");
    setRuleSubmitError("");
    setRuleStatusMessage("");
    setRuleStatusError("");
    setRuleDeleteMessage("");
    setRuleDeleteError("");
  };

  const handleRuleFieldChange = (field) => (event) => {
    const { value } = event.target;
    clearRuleFeedback();
    setRuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRuleFieldDirectChange = (field, value) => {
    clearRuleFeedback();
    setRuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyQuickConversion = () => {
    clearRuleFeedback();
    setRuleForm((prev) => ({
      ...prev,
      conversionType: "points",
      conversionValue: "",
      conversionPointsAmount: "1",
      conversionCurrencyAmount: "100",
      conversionPreviewPoints: prev.conversionPreviewPoints || "100",
    }));
  };

  const handleEditRule = (ruleId) => {
    clearRuleFeedback();
    const target =
      rawRules.find((rule) => (rule._id || rule.id) === ruleId) || null;
    if (!target) return;
    setEditingRuleId(ruleId);
    setRuleForm(mapRuleToFormValues(target));
    setShowRuleForm(true);
  };

  const handleCancelEdit = () => {
    clearRuleFeedback();
    setEditingRuleId(null);
    setRuleForm(createSimpleRuleForm());
  };

  const handleRuleDateChange = (field) => (event) => {
    const { value } = event.target;
    clearRuleFeedback();
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

  const handleRuleFormSubmit = async (event) => {
    event.preventDefault();
    clearRuleFeedback();
    setSavingRule(true);
    try {
      const payload = buildRulePayload(ruleForm);
      if (editingRuleId) {
        await updateLoyaltyRule(editingRuleId, payload);
        setRuleSubmitMessage("Đã cập nhật quy tắc.");
      } else {
        await createLoyaltyRule(payload);
        setRuleSubmitMessage("Đã lưu quy tắc mới.");
      }
      setRuleForm(createSimpleRuleForm());
      setEditingRuleId(null);
      await fetchRules();
    } catch (error) {
      setRuleSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể lưu quy tắc."
      );
    } finally {
      setSavingRule(false);
    }
  };

  const handleResetRuleForm = () => {
    clearRuleFeedback();
    setRuleForm(createSimpleRuleForm());
    setEditingRuleId(null);
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

  const editingRuleTitle = useMemo(() => {
    if (!editingRuleId) return "";
    const target = earningRules.find((rule) => rule.id === editingRuleId);
    return target?.title || "";
  }, [editingRuleId, earningRules]);

  const filteredHistory = useMemo(() => {
    if (!historySearch) return transactions;
    const keyword = historySearch.toLowerCase();
    return transactions.filter((item) => {
      const id = item.id?.toLowerCase() || "";
      const member = item.member?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const action = item.action?.toLowerCase() || "";
      const detail = item.detail?.toLowerCase() || "";
      return (
        id.includes(keyword) ||
        member.includes(keyword) ||
        email.includes(keyword) ||
        action.includes(keyword) ||
        detail.includes(keyword)
      );
    });
  }, [transactions, historySearch]);

  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === "all") return auditLogs;
    return auditLogs.filter((log) => {
      const riskValue = (log.risk || "").toLowerCase();
      return riskValue === auditFilter.toLowerCase();
    });
  }, [auditFilter, auditLogs]);

  const historySummary = useMemo(() => {
    const totalTx = transactions.length;
    const earnTx = transactions.filter((item) => item.delta > 0).length;
    const redeemTx = transactions.filter((item) => item.delta < 0).length;
    const warningLogs = auditLogs.filter(
      (log) => (log.risk || "").toLowerCase() === "cảnh báo"
    ).length;
    return {
      totalTx,
      earnTx,
      redeemTx,
      warningLogs,
    };
  }, [transactions, auditLogs]);

  const recentAdjustments = useMemo(() => auditLogs.slice(0, 5), [auditLogs]);

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

      {showHistoryPanel && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Lịch sử điều chỉnh gần đây</CardTitle>
              <p className="text-sm text-muted-foreground">
                Theo dõi nhanh những điều chỉnh thủ công/engine đã áp dụng trong
                48h qua.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryPanel(false)}
              >
                Đóng bảng
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditError && (
              <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {auditError}
              </div>
            )}
            {loadingAudits && !auditError && (
              <p className="text-sm text-muted-foreground">
                Đang tải audit log...
              </p>
            )}
            {!loadingAudits && !auditError && (
              <>
                {recentAdjustments.length ? (
                  recentAdjustments.map((log, index) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-amber-100 bg-white/70 p-3 text-sm shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <span className="text-xs text-muted-foreground">
                            #{index + 1}
                          </span>
                          {log.change}
                        </div>
                        <Badge
                          variant={
                            log.risk === "Cảnh báo"
                              ? "destructive"
                              : log.risk === "Trung bình"
                              ? "secondary"
                              : "success"
                          }
                          className="text-xs uppercase"
                        >
                          {log.risk}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>
                          Bởi:{" "}
                          <span className="font-medium text-gray-900">
                            {log.actor}
                          </span>
                        </p>
                        <p>Lý do: {log.reason}</p>
                        <p className="mt-1 text-gray-700">{log.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có điều chỉnh nào được ghi nhận.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
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
              {editingRuleId && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div>
                    <p className="font-medium text-amber-900">
                      Đang cập nhật voucher
                    </p>
                    <p className="text-amber-700">
                      {editingRuleTitle || "Voucher chưa đặt tên"} (ID:{" "}
                      {editingRuleId})
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={savingRule}
                  >
                    Huỷ chỉnh sửa
                  </Button>
                </div>
              )}
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
                    <div className="space-y-2">
                      <Label htmlFor="voucherValidityDays">
                        Voucher có hiệu lực (ngày)
                      </Label>
                      <Input
                        id="voucherValidityDays"
                        type="number"
                        min="1"
                        placeholder="Ví dụ: 60"
                        value={ruleForm.voucherValidityDays}
                        onChange={handleRuleFieldChange("voucherValidityDays")}
                      />
                      <p className="text-xs text-muted-foreground">
                        Nhập số ngày voucher có hiệu lực sau khi được tạo.
                      </p>
                    </div>
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
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="conversionPercent">
                          Tỷ lệ % thưởng thêm
                        </Label>
                        <div className="relative">
                          <Input
                            id="conversionPercent"
                            type="number"
                            min="0"
                            step="0.1"
                            className="pr-14"
                            placeholder="VD: 5"
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
                      <div className="space-y-2">
                        <Label htmlFor="conversionPercentCost">
                          Số điểm cần để đổi ưu đãi này
                        </Label>
                        <Input
                          id="conversionPercentCost"
                          type="number"
                          min="0"
                          placeholder="VD: 500"
                          value={ruleForm.conversionPreviewPoints}
                          onChange={handleRuleFieldChange(
                            "conversionPreviewPoints"
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          Thành viên phải có ít nhất chừng này điểm để đổi ưu
                          đãi phần trăm.
                        </p>
                      </div>
                    </>
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
                      {editingRuleId ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRule(editingRuleId)}
                          className="gap-1"
                          disabled={deletingRuleId}
                        >
                          <X className="size-4" />
                          {deletingRuleId ? "Dang xoá..." : "xoá"}
                        </Button>
                      ) : (
                        ""
                      )}
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
                    Tỉ lệ: {conversionSummaryText} • Số voucher:{" "}
                    <p>Voucher có hiệu lực: {ruleForm.voucherValidityDays}</p>
                    {ruleForm.voucherQuantity || "Chưa nhập"}
                  </p>
                  <p>Mô tả: {ruleForm.voucherDescription || "Chưa cập nhật"}</p>
                </div>
              </div>

              {ruleSubmitError && (
                <p className="text-sm text-destructive">{ruleSubmitError}</p>
              )}
              {ruleSubmitMessage && (
                <p className="text-sm text-green-600">{ruleSubmitMessage}</p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetRuleForm}
                  disabled={savingRule}
                >
                  {editingRuleId ? "Huỷ chỉnh sửa" : "Xóa dữ liệu"}
                </Button>
                <Button type="submit" className="gap-2" disabled={savingRule}>
                  <Sparkles className="size-4" />
                  {editingRuleId ? "Cập nhật voucher" : "Lưu cấu hình nháp"}
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

      <div className="grid gap-4 lg:grid-cols-1">
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
              {earningRules.length} Voucher
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRules ? (
              <p className="text-sm text-muted-foreground">
                Đang tải quy tắc...
              </p>
            ) : rulesError ? (
              <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {rulesError}
              </div>
            ) : earningRules.length ? (
              earningRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    editingRuleId === rule.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-gray-400"
                  }`}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rule.expiry} hết hạn
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRule(rule.id)}
                        className={`gap-1 ${
                          editingRuleId === rule.id
                            ? "border-primary text-primary"
                            : ""
                        }`}
                      >
                        <Pencil className="size-4" />
                        Cập nhật
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRuleStatusChange(rule.id, "active")
                        }
                        className={`${
                          rule.status === "active"
                            ? "bg-green-600 text-white"
                            : ""
                        }`}
                      >
                        Bật
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRuleStatusChange(rule.id, "inactive")
                        }
                        className={`${
                          rule.status === "active"
                            ? ""
                            : "bg-red-700 text-white"
                        }`}
                      >
                        Tắt
                      </Button>
                    </div>
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
                        {rule.schedule}
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
            <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center">
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Tìm mã giao dịch, email..."
                    className="h-9 pl-9 pr-9"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-gray-900"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs uppercase text-muted-foreground">
                Tổng giao dịch
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {formatNumber(historySummary.totalTx)}
              </p>
            </div>
            <div className="rounded-lg border bg-green-50 p-3">
              <p className="text-xs uppercase text-green-700">Cộng điểm</p>
              <p className="text-xl font-semibold text-green-700">
                {formatNumber(historySummary.earnTx)}
              </p>
            </div>
            <div className="rounded-lg border bg-rose-50 p-3">
              <p className="text-xs uppercase text-rose-700">Trừ điểm</p>
              <p className="text-xl font-semibold text-rose-700">
                {formatNumber(historySummary.redeemTx)}
              </p>
            </div>
            <div className="rounded-lg border bg-amber-50 p-3">
              <p className="text-xs uppercase text-amber-700">Cảnh báo</p>
              <p className="text-xl font-semibold text-amber-700">
                {formatNumber(historySummary.warningLogs)}
              </p>
            </div>
          </div>
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
              <div className="flex flex-wrap items-center gap-2 pb-2">
                {["all", "Cảnh báo", "Trung bình", "Thấp"].map((risk) => (
                  <Button
                    key={risk}
                    size="sm"
                    type="button"
                    variant={auditFilter === risk ? "default" : "outline"}
                    onClick={() => setAuditFilter(risk)}
                    className="text-xs"
                  >
                    {risk === "all" ? "Tất cả" : risk}
                  </Button>
                ))}
              </div>
              {auditError && (
                <div className="mb-3 rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {auditError}
                </div>
              )}
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
                  {loadingAudits ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-4 text-center text-sm text-muted-foreground"
                      >
                        Đang tải audit log...
                      </TableCell>
                    </TableRow>
                  ) : auditError ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-4 text-center text-sm text-destructive"
                      >
                        Không thể hiển thị audit log. Vui lòng thử lại.
                      </TableCell>
                    </TableRow>
                  ) : filteredAuditLogs.length ? (
                    filteredAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-semibold">
                          {log.id}
                        </TableCell>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-4 text-center text-sm text-muted-foreground"
                      >
                        Không có log phù hợp với bộ lọc này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyProgram;
