const {
  LoyalPoint,
  LoyaltyTransaction,
  Invoice,
  LoyaltyVoucher,
} = require("../model");
const { UsersService } = require("./users.service");

const VOUCHER_CATALOG = {
  "voucher-50": {
    id: "voucher-50",
    title: "Voucher 50.000₫",
    cost: 500,
    value: 50000,
    currency: "VND",
    discountType: "fixed",
    validityDays: 60,
    stock: 128,
  },
  "voucher-120": {
    id: "voucher-120",
    title: "Voucher 120.000₫",
    cost: 1000,
    value: 120000,
    currency: "VND",
    discountType: "fixed",
    validityDays: 60,
    stock: 62,
  },
  cashback: {
    id: "cashback",
    title: "Hoàn tiền 5%",
    cost: 1500,
    value: 5,
    currency: "VND",
    discountType: "percentage",
    validityDays: 45,
    stock: null,
  },
};

const EARNING_RULES = [
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

const TIER_LEVELS = [
  {
    id: "bronze",
    label: "Đồng",
    minPoints: 0,
    benefits: "Tích điểm 1% mỗi giao dịch.",
  },
  {
    id: "silver",
    label: "Bạc",
    minPoints: 500,
    benefits: "Hoàn tiền 2% và ưu tiên đặt lịch.",
  },
  {
    id: "gold",
    label: "Vàng",
    minPoints: 1500,
    benefits: "Ưu tiên hỗ trợ và ưu đãi 3%.",
  },
  {
    id: "platinum",
    label: "Bạch Kim",
    minPoints: 3000,
    benefits: "Hỗ trợ VIP và giảm 5% dịch vụ.",
  },
];

class LoyaltyService {
  async getOrCreateWallet(clerkId) {
    let wallet = await LoyalPoint.findOne({ clerkId });
    if (!wallet) {
      wallet = await LoyalPoint.create({ clerkId, total_points: 0 });
    }
    return wallet;
  }

  async getBalanceByClerkId(clerkId) {
    const wallet = await this.getOrCreateWallet(clerkId);
    const activeVoucherCount = await LoyaltyVoucher.countDocuments({
      clerkId,
      status: "active",
    });
    const tierInfo = calculateTierInfo(wallet.total_points || 0);

    return {
      clerkId,
      balance: wallet.total_points,
      updatedAt: wallet.updatedAt,
      vouchersOwned: activeVoucherCount,
      ...tierInfo,
    };
  }

  async getHistory(clerkId, { limit = 20, page = 1 }) {
    const query = { clerkId };
    const sort = { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      LoyaltyTransaction.find(query).sort(sort).skip(skip).limit(Number(limit)),
      LoyaltyTransaction.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        limit: Number(limit),
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async awardPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    expiresAt,
    performedBy,
    metadata,
  }) {
    if (points <= 0) throw new Error("Points must be positive for award");

    const wallet = await this.getOrCreateWallet(clerkId);
    wallet.total_points += points;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "earn",
      points,
      balanceAfter: wallet.total_points,
      reason,
      sourceRef,
      expiresAt,
      performedBy,
      metadata,
    });

    return { wallet: decorateWallet(wallet), transaction: tx };
  }

  async redeemPoints({
    clerkId,
    points,
    reason,
    sourceRef,
    performedBy,
    metadata,
  }) {
    if (points <= 0) throw new Error("Points must be positive for redeem");

    const wallet = await this.getOrCreateWallet(clerkId);
    if (wallet.total_points < points) {
      throw new Error("Insufficient points");
    }

    wallet.total_points -= points;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "redeem",
      points: -points,
      balanceAfter: wallet.total_points,
      reason,
      sourceRef,
      performedBy,
      metadata,
    });

    return { wallet: decorateWallet(wallet), transaction: tx };
  }

  async adjustPoints({ clerkId, points, reason, performedBy, metadata }) {
    if (!points) throw new Error("points must be non-zero for adjust");
    const wallet = await this.getOrCreateWallet(clerkId);
    wallet.total_points += points;
    if (wallet.total_points < 0) wallet.total_points = 0;
    wallet.updated_at = new Date();
    await wallet.save();

    const tx = await LoyaltyTransaction.create({
      clerkId,
      type: "adjust",
      points,
      balanceAfter: wallet.total_points,
      reason,
      performedBy,
      metadata,
    });

    return { wallet: decorateWallet(wallet), transaction: tx };
  }

  async awardFromInvoice(invoiceId, clerkId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (!clerkId) throw new Error("Missing clerkId");

    const points = invoice.loyalty_points_earned ?? 0;
    if (points <= 0) return null;

    return this.awardPoints({
      clerkId,
      points,
      reason: `Award from invoice ${invoice.invoiceNumber}`,
      sourceRef: { kind: "invoice", refId: invoice._id },
      metadata: { invoiceId: invoice._id, amount: invoice.amount },
    });
  }

  getVoucherCatalog() {
    return Object.values(VOUCHER_CATALOG);
  }

  async generateVoucherCode(prefix = "VC") {
    const attempts = 5;
    for (let i = 0; i < attempts; i += 1) {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${prefix}-${randomPart}`;
      const exists = await LoyaltyVoucher.exists({ voucherCode: code });
      if (!exists) return code;
    }
    throw new Error("Could not generate a unique voucher code");
  }

  async redeemVoucher({ clerkId, rewardId, performedBy, metadata = {} }) {
    if (!clerkId) throw new Error("clerkId is required");
    if (!rewardId) throw new Error("rewardId is required");

    const reward = VOUCHER_CATALOG[rewardId];
    if (!reward) throw new Error("Reward is not available");

    const issuedAt = new Date();
    const expiresAt = reward.validityDays
      ? new Date(issuedAt.getTime() + reward.validityDays * 24 * 60 * 60 * 1000)
      : null;
    const voucherCode = await this.generateVoucherCode("VC");
    const redemptionMetadata = {
      ...metadata,
      rewardId: reward.id,
      rewardName: reward.title,
      voucherCode,
      voucherValue: reward.value,
      voucherCurrency: reward.currency,
      voucherExpiresAt: expiresAt,
    };

    const { wallet, transaction } = await this.redeemPoints({
      clerkId,
      points: reward.cost,
      reason: `Redeem ${reward.title}`,
      sourceRef: { kind: "voucher" },
      performedBy,
      metadata: redemptionMetadata,
    });

    const voucher = await LoyaltyVoucher.create({
      clerkId,
      rewardId: reward.id,
      rewardName: reward.title,
      voucherCode,
      pointsCost: reward.cost,
      value: reward.value,
      currency: reward.currency,
      discountType: reward.discountType,
      status: "active",
      issuedAt,
      expiresAt,
      transactionId: transaction._id,
      metadata: redemptionMetadata,
    });

    await LoyaltyTransaction.findByIdAndUpdate(transaction._id, {
      $set: { sourceRef: { kind: "voucher", refId: voucher._id } },
    });

    const transactionPayload =
      typeof transaction.toObject === "function"
        ? transaction.toObject()
        : transaction;
    transactionPayload.sourceRef = { kind: "voucher", refId: voucher._id };
    const vouchersOwned = await LoyaltyVoucher.countDocuments({
      clerkId,
      status: "active",
    });
    const walletPayload = decorateWallet(wallet, { vouchersOwned });

    return {
      voucher,
      wallet: walletPayload,
      transaction: transactionPayload,
      reward,
    };
  }

  async getProgramOverview({ windowDays = 30 } = {}) {
    const safeWindowDays = Math.max(Number(windowDays) || 30, 1);
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - safeWindowDays * 24 * 60 * 60 * 1000
    );
    const expiringEnd = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const [
      engagedMembers,
      totalPointsAgg,
      redeemedPointsAgg,
      activeMembersAgg,
      expiringSoonAgg,
      leaderboardRaw,
      recentTransactions,
      voucherStatuses,
    ] = await Promise.all([
      LoyalPoint.countDocuments(),
      LoyalPoint.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$total_points" },
          },
        },
      ]),
      LoyaltyTransaction.aggregate([
        { $match: { type: "redeem" } },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: "$points" } },
          },
        },
      ]),
      LoyaltyTransaction.aggregate([
        { $match: { createdAt: { $gte: windowStart } } },
        { $group: { _id: "$clerkId" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),
      LoyaltyTransaction.aggregate([
        {
          $match: {
            expiresAt: { $gte: now, $lte: expiringEnd },
            points: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$points" },
          },
        },
      ]),
      LoyalPoint.find({})
        .sort({ total_points: -1 })
        .limit(5)
        .select("clerkId total_points updatedAt")
        .lean(),
      this.getTransactions({ limit: 10 }),
      LoyaltyVoucher.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalPoints = totalPointsAgg[0]?.total || 0;
    const redeemedPoints = redeemedPointsAgg[0]?.total || 0;
    const activeMembers = activeMembersAgg[0]?.count || 0;
    const expiringSoon = expiringSoonAgg[0]?.total || 0;

    const leaderboard = leaderboardRaw.map((entry) => ({
      clerkId: entry.clerkId,
      balance: entry.total_points,
      updatedAt: entry.updatedAt,
    }));

    const leaderboardProfileMap =
      leaderboard.length > 0
        ? await UsersService.getProfilesByIds(
            leaderboard.map((entry) => entry.clerkId)
          )
        : {};

    const decoratedLeaderboard = leaderboard.map((entry) => ({
      ...entry,
      memberProfile: leaderboardProfileMap[entry.clerkId] || null,
    }));

    const voucherBreakdown = voucherStatuses.reduce(
      (acc, row) => {
        acc[row._id] = row.total;
        return acc;
      },
      { active: 0, used: 0, expired: 0, cancelled: 0 }
    );

    return {
      stats: {
        engagedMembers,
        activeMembers,
        totalPoints,
        redeemedPoints,
        expiringSoon,
        campaigns: Object.keys(VOUCHER_CATALOG).length,
      },
      leaderboard: decoratedLeaderboard,
      recentTransactions,
      vouchers: voucherBreakdown,
      catalogSummary: {
        rewards: this.getVoucherCatalog(),
        earningRules: EARNING_RULES,
        tierLevels: TIER_LEVELS,
      },
    };
  }

  async getTransactions({ limit = 20, type } = {}) {
    const sanitizedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );
    const query = {};
    if (type && ["earn", "redeem", "adjust"].includes(type)) {
      query.type = type;
    }
    const records = await LoyaltyTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(sanitizedLimit)
      .lean();

    const clerkIds = [
      ...new Set(records.map((tx) => tx.clerkId).filter(Boolean)),
    ];
    const profileMap = clerkIds.length
      ? await UsersService.getProfilesByIds(clerkIds)
      : {};

    return records.map((tx) => ({
      ...tx,
      memberProfile: profileMap[tx.clerkId] || null,
    }));
  }

  getCatalogDetails() {
    return {
      earningRules: EARNING_RULES,
      rewards: this.getVoucherCatalog(),
      tierLevels: TIER_LEVELS,
    };
  }

  getEarningRules() {
    return EARNING_RULES;
  }
}

module.exports = {
  LoyaltyService: new LoyaltyService(),
  VOUCHER_CATALOG,
  EARNING_RULES,
  TIER_LEVELS,
};

function calculateTierInfo(points = 0) {
  let currentTier = TIER_LEVELS[0];
  for (const tier of TIER_LEVELS) {
    if (points >= tier.minPoints) currentTier = tier;
  }
  const currentTierIndex = TIER_LEVELS.findIndex(
    (tier) => tier.id === currentTier.id
  );
  const nextTier = TIER_LEVELS[currentTierIndex + 1] || null;
  const tierFloor = currentTier.minPoints;
  const nextThreshold = nextTier ? nextTier.minPoints : tierFloor || points;
  const tierCeiling = nextTier ? nextTier.minPoints : nextThreshold;

  return {
    tierId: currentTier.id,
    tier: currentTier.label,
    tierBenefits: currentTier.benefits,
    tierFloor,
    tierCeiling,
    nextTierLabel: nextTier?.label || null,
    nextRewardThreshold: nextThreshold,
  };
}

function decorateWallet(walletDoc, extra = {}) {
  if (!walletDoc) return walletDoc;
  const walletData =
    typeof walletDoc.toObject === "function" ? walletDoc.toObject() : walletDoc;
  walletData.balance = walletData.total_points ?? walletData.balance ?? 0;
  const tierInfo = calculateTierInfo(walletData.balance);
  return { ...walletData, ...tierInfo, ...extra };
}
