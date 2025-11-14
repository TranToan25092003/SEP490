const {
  LoyalPoint,
  LoyaltyTransaction,
  Invoice,
  LoyaltyVoucher,
} = require("../model");

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
    return {
      clerkId,
      balance: wallet.total_points,
      updatedAt: wallet.updatedAt,
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

    return { wallet, transaction: tx };
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

    return { wallet, transaction: tx };
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

    return { wallet, transaction: tx };
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
    const walletPayload =
      typeof wallet.toObject === "function" ? wallet.toObject() : wallet;

    return {
      voucher,
      wallet: walletPayload,
      transaction: transactionPayload,
      reward,
    };
  }
}

module.exports = {
  LoyaltyService: new LoyaltyService(),
  VOUCHER_CATALOG,
};
