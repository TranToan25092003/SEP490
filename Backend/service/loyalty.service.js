const { Types } = require("mongoose");
const {
  LoyalPoint,
  LoyaltyTransaction,
  Invoice,
  LoyaltyVoucher,
  LoyaltyRule,
} = require("../model");
const { UsersService } = require("./users.service");

const PAYMENT_BONUS_POINTS = 50;
const PAYMENT_CONVERSION_UNIT = 10000;

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
    const rewards = await this.getVoucherCatalog();
    const ownedVouchers = await LoyaltyVoucher.find({ clerkId })
      .sort({ createdAt: -1 })
      .limit(25)
      .select(
        "voucherCode status expiresAt rewardName discountType value currency pointsCost createdAt issuedAt redeemedAt"
      )
      .lean();

    return {
      clerkId,
      balance: wallet.total_points,
      updatedAt: wallet.updatedAt,
      vouchersOwned: activeVoucherCount,
      vouchers: ownedVouchers.map((voucher) => ({
        id: voucher._id,
        code: voucher.voucherCode,
        status: voucher.status,
        rewardName: voucher.rewardName,
        pointsCost: voucher.pointsCost,
        value: voucher.value,
        currency: voucher.currency,
        discountType: voucher.discountType,
        issuedAt: voucher.issuedAt || voucher.createdAt,
        expiresAt: voucher.expiresAt,
        redeemedAt: voucher.redeemedAt || null,
      })),
      ...tierInfo,
      catalog: {
        rewards,
      },
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

  async handleInvoicePaymentSuccess({
    invoiceId,
    clerkId,
    amount,
    voucherCode,
    performedBy,
  }) {
    if (!clerkId) return null;
    console.log(amount);
    const normalizedAmount = Math.max(Number(amount) || 0, 0);
    const basePoints = PAYMENT_BONUS_POINTS;
    const conversionPoints = Math.floor(
      normalizedAmount / PAYMENT_CONVERSION_UNIT
    );
    const totalPoints = Math.max(basePoints + conversionPoints, 0);

    console.log(totalPoints);

    let transactionResult = null;
    if (totalPoints > 0) {
      let invoiceObjectId = null;
      if (invoiceId && Types.ObjectId.isValid(invoiceId)) {
        invoiceObjectId = new Types.ObjectId(invoiceId);
      }

      const alreadyAwarded = await LoyaltyTransaction.exists({
        clerkId,
        "sourceRef.kind": "invoice",
        ...(invoiceObjectId && { "sourceRef.refId": invoiceObjectId }),
      });

      if (!alreadyAwarded) {
        transactionResult = await this.awardPoints({
          clerkId,
          points: totalPoints,
          reason: `Thanh toan hoa don ${invoiceId}`,
          sourceRef: invoiceObjectId
            ? { kind: "invoice", refId: invoiceObjectId }
            : { kind: "invoice" },
          performedBy,
          metadata: {
            invoiceId,
            amount: normalizedAmount,
            voucherCode: voucherCode || null,
            basePoints,
            conversionPoints,
          },
        });
      }
    }

    let voucherUpdate = null;
    if (voucherCode) {
      voucherUpdate = await LoyaltyVoucher.findOneAndUpdate(
        { voucherCode, clerkId, status: "active" },
        {
          $set: {
            status: "used",
            redeemedAt: new Date(),
            redeemedBy: performedBy || clerkId,
          },
        },
        { new: true }
      );
    }

    return {
      voucher: voucherUpdate,
      pointsAwarded: transactionResult ? totalPoints : 0,
    };
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

  async getVoucherCatalog() {
    const now = new Date();
    const rules = await LoyaltyRule.find({
      isDeleted: false,
      status: "active",
      $and: [
        {
          $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
        },
        {
          $or: [{ validTo: null }, { validTo: { $gte: now } }],
        },
      ],
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    return await this.transformRulesToRewards(rules);
  }

  async transformRulesToRewards(rules = []) {
    if (!rules || !rules.length) return [];
    const ruleIds = rules
      .map((rule) =>
        typeof rule._id === "object" && typeof rule._id.toString === "function"
          ? rule._id.toString()
          : rule.id || null
      )
      .filter(Boolean);
    const issuedCounts = ruleIds.length
      ? await LoyaltyVoucher.aggregate([
          { $match: { rewardId: { $in: ruleIds } } },
          { $group: { _id: "$rewardId", total: { $sum: 1 } } },
        ])
      : [];
    const issuedMap = issuedCounts.reduce((acc, doc) => {
      acc[doc._id] = doc.total;
      return acc;
    }, {});

    return rules
      .filter((rule) => this.isRuleUsable(rule))
      .map((rule) => this.formatRuleReward(rule, issuedMap))
      .filter(Boolean);
  }

  isRuleUsable(rule) {
    if (!rule || rule.isDeleted) return false;
    if (rule.status !== "active") return false;
    const now = new Date();
    if (rule.validFrom) {
      const start = new Date(rule.validFrom);
      if (Number.isNaN(start.getTime())) {
        return false;
      }
      if (now < start) return false;
    }
    if (rule.validTo) {
      const end = new Date(rule.validTo);
      if (Number.isNaN(end.getTime())) {
        return false;
      }
      if (now > end) return false;
    }
    return true;
  }

  formatRuleReward(rule, issuedMap = {}) {
    const ruleId =
      typeof rule._id === "object" && typeof rule._id.toString === "function"
        ? rule._id.toString()
        : rule.id || null;
    if (!ruleId) return null;

    const cost =
      Number(rule.conversionPreviewPoints) ||
      Number(rule.conversionPointsAmount) ||
      0;

    if (!cost || cost <= 0) {
      return null;
    }

    const discountType =
      rule.conversionType === "percent" ? "percentage" : "fixed";
    const value =
      discountType === "percentage"
        ? Number(rule.conversionValue) || 0
        : Number(
            rule.conversionCurrencyAmount * rule.conversionPreviewPoints
          ) || 0;
    if (value <= 0) {
      return null;
    }

    const maxStock = Number(rule.voucherQuantity) || 0;
    const issued = issuedMap[ruleId] || 0;
    if (maxStock && issued >= maxStock) {
      return null;
    }

    const remaining = maxStock ? Math.max(maxStock - issued, 0) : null;

    return {
      id: ruleId,
      ruleId,
      title: rule.name || "Voucher",
      description: rule.voucherDescription || rule.description || "",
      cost,
      value,
      currency: "VND",
      discountType,
      validityDays: Number(rule.voucherValidityDays) || 60,
      stock: maxStock || null,
      remainingStock: remaining,
      priority: rule.priority || 1,
    };
  }

  async getRuleRewardById(rewardId) {
    if (!rewardId || !Types.ObjectId.isValid(rewardId)) {
      return null;
    }
    const rule = await LoyaltyRule.findOne({
      _id: rewardId,
      isDeleted: false,
    }).lean();
    if (!rule || !this.isRuleUsable(rule)) {
      return null;
    }
    const rewards = await this.transformRulesToRewards([rule]);
    return rewards[0] || null;
  }

  async generateVoucherCode(prefix = "VC") {
    const attempts = 5;
    for (let i = 0; i < attempts; i += 1) {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const code = `${prefix}-${randomPart}`;
      const exists = await LoyaltyVoucher.exists({ voucherCode: code });
      if (!exists) return code;
    }
    throw new Error("Could not generate a unique voucher code");
  }

  async redeemVoucher({ clerkId, rewardId, performedBy, metadata = {} }) {
    if (!clerkId) throw new Error("clerkId is required");
    if (!rewardId) throw new Error("rewardId is required");

    const reward = await this.getRuleRewardById(rewardId);

    if (!reward) throw new Error("Reward is not available");
    if (!reward.cost || reward.cost <= 0) {
      throw new Error("Reward configuration is invalid");
    }

    const isDynamicReward = Boolean(reward.ruleId);
    if (isDynamicReward && reward.stock) {
      const minted = await LoyaltyVoucher.countDocuments({
        rewardId: reward.id,
      });
      if (minted >= reward.stock) {
        throw new Error("Voucher da het so luong");
      }
    }

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
      ruleId: reward.ruleId || null,
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

    let rewardPayload = reward;
    if (isDynamicReward) {
      const minted = await LoyaltyVoucher.countDocuments({
        rewardId: reward.id,
      });
      rewardPayload = {
        ...reward,
        remainingStock: reward.stock
          ? Math.max(reward.stock - minted, 0)
          : reward.remainingStock,
      };
    }

    return {
      voucher,
      wallet: walletPayload,
      transaction: transactionPayload,
      reward: rewardPayload,
    };
  }

  async getProgramOverview({ windowDays = 30 } = {}) {
    const safeWindowDays = Math.max(Number(windowDays) || 30, 1);
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - safeWindowDays * 24 * 60 * 60 * 1000
    );
    const expiringEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      engagedMembers,
      totalPointsAgg,
      redeemedPointsAgg,
      activeMembersAgg,
      expiringSoonAgg,
      leaderboardRaw,
      recentTransactions,
      voucherStatuses,
      catalogRewards,
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
      this.getVoucherCatalog(),
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
        campaigns: catalogRewards.length,
      },
      leaderboard: decoratedLeaderboard,
      recentTransactions,
      vouchers: voucherBreakdown,
      catalogSummary: {
        rewards: catalogRewards,
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

  async getCatalogDetails() {
    const rewards = await this.getVoucherCatalog();
    return {
      earningRules: EARNING_RULES,
      rewards,
      tierLevels: TIER_LEVELS,
    };
  }

  getEarningRules() {
    return EARNING_RULES;
  }
}

module.exports = {
  LoyaltyService: new LoyaltyService(),
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
