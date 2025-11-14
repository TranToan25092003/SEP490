const {
  LoyaltyRule,
  LoyaltyRuleAudit,
} = require("../../model");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const STATUS_VALUES = ["draft", "active", "inactive", "archived"];

class LoyaltyRulesService {
  static formatRule(doc) {
    if (!doc) return null;
    if (typeof doc.toObject === "function") {
      return doc.toObject();
    }
    return doc;
  }

  static normalizeNumber(value, fallback = undefined) {
    if (value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static async logAudit(ruleId, action, before, after, actor, metadata = null) {
    try {
      await LoyaltyRuleAudit.create({
        ruleId,
        action,
        before,
        after,
        actorId: actor?.id || null,
        actorName: actor?.name || null,
        actorEmail: actor?.email || null,
        metadata,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to log loyalty rule audit", error);
    }
  }

  static validateDates(validFrom, validTo) {
    if (validFrom && validTo) {
      const start = new Date(validFrom);
      const end = new Date(validTo);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("Ngày áp dụng không hợp lệ");
      }
      if (end <= start) {
        throw new Error("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      }
    }
  }

  static validateConversion(payload) {
    if (payload.conversionType === "percent") {
      const percent = this.normalizeNumber(payload.conversionValue);
      if (!percent && percent !== 0) {
        throw new Error("Phần trăm quy đổi phải được nhập");
      }
      if (percent < 0) {
        throw new Error("Phần trăm quy đổi không hợp lệ");
      }
      payload.conversionValue = percent;
      payload.conversionPointsAmount = 0;
      payload.conversionCurrencyAmount = 0;
    } else {
      const pointUnit = this.normalizeNumber(payload.conversionPointsAmount);
      const currencyUnit = this.normalizeNumber(payload.conversionCurrencyAmount);
      if (!pointUnit || pointUnit <= 0) {
        throw new Error("Điểm quy đổi phải lớn hơn 0");
      }
      if (currencyUnit === undefined || currencyUnit < 0) {
        throw new Error("Giá trị tiền quy đổi không hợp lệ");
      }
      payload.conversionPointsAmount = pointUnit;
      payload.conversionCurrencyAmount = currencyUnit;
      payload.conversionValue = 0;
    }
    payload.conversionPreviewPoints =
      this.normalizeNumber(payload.conversionPreviewPoints) ?? 0;
  }

  static sanitizePayload(data = {}, { isUpdate = false } = {}) {
    const payload = { ...data };
    if (!isUpdate || payload.name !== undefined) {
      if (!payload.name || !payload.name.trim()) {
        throw new Error("Tên quy tắc là bắt buộc");
      }
      payload.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      payload.description = payload.description?.trim() || "";
    }
    if (payload.voucherDescription !== undefined) {
      payload.voucherDescription = payload.voucherDescription?.trim() || "";
    }
    if (payload.voucherQuantity !== undefined) {
      const qty = this.normalizeNumber(payload.voucherQuantity, 0);
      if (qty < 0) {
        throw new Error("Số lượng voucher không hợp lệ");
      }
      payload.voucherQuantity = qty;
    }
    if (payload.priority !== undefined) {
      const priority = this.normalizeNumber(payload.priority, 1);
      if (priority < 1) {
        throw new Error("Ưu tiên phải lớn hơn 0");
      }
      payload.priority = priority;
    }
    if (payload.conversionType && !["points", "percent"].includes(payload.conversionType)) {
      throw new Error("Kiểu quy đổi không hợp lệ");
    }
    payload.conversionType = payload.conversionType || "points";
    this.validateConversion(payload);
    this.validateDates(payload.validFrom, payload.validTo);
    return payload;
  }

  async getRuleById(id) {
    const rule = await LoyaltyRule.findOne({ _id: id, isDeleted: false }).lean();
    if (!rule) {
      throw new Error("Không tìm thấy quy tắc");
    }
    return rule;
  }

  async listRules(query = {}) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search = "",
      status,
      sortBy = "priority",
      sortOrder = "asc",
    } = query;

    const filter = { isDeleted: false };
    if (status && STATUS_VALUES.includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { voucherDescription: { $regex: search, $options: "i" } },
      ];
    }

    const safePage = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    sort.createdAt = sort.createdAt || -1;

    const [items, total] = await Promise.all([
      LoyaltyRule.find(filter).sort(sort).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
      LoyaltyRule.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async createRule(data = {}, actor = {}) {
    const payload = LoyaltyRulesService.sanitizePayload(data);
    const now = new Date();
    const rule = await LoyaltyRule.create({
      ...payload,
      status: payload.status || "draft",
      createdBy: actor?.id || null,
      updatedBy: actor?.id || null,
      createdAt: now,
      updatedAt: now,
    });

    await LoyaltyRulesService.logAudit(
      rule._id,
      "create",
      null,
      LoyaltyRulesService.formatRule(rule),
      actor
    );

    return LoyaltyRulesService.formatRule(rule);
  }

  async updateRule(id, data = {}, actor = {}) {
    const existing = await LoyaltyRule.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      throw new Error("Không tìm thấy quy tắc");
    }
    const payload = LoyaltyRulesService.sanitizePayload(data, { isUpdate: true });
    const before = LoyaltyRulesService.formatRule(existing);

    Object.assign(existing, payload, {
      updatedBy: actor?.id || null,
      updatedAt: new Date(),
    });
    await existing.save();

    await LoyaltyRulesService.logAudit(
      existing._id,
      "update",
      before,
      LoyaltyRulesService.formatRule(existing),
      actor
    );

    return LoyaltyRulesService.formatRule(existing);
  }

  async updateStatus(id, status, actor = {}) {
    if (!STATUS_VALUES.includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }
    const existing = await LoyaltyRule.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      throw new Error("Không tìm thấy quy tắc");
    }
    const before = LoyaltyRulesService.formatRule(existing);

    existing.status = status;
    existing.updatedBy = actor?.id || null;
    existing.updatedAt = new Date();
    await existing.save();

    await LoyaltyRulesService.logAudit(
      existing._id,
      "status",
      before,
      LoyaltyRulesService.formatRule(existing),
      actor,
      { status }
    );

    return LoyaltyRulesService.formatRule(existing);
  }

  async deleteRule(id, actor = {}) {
    const existing = await LoyaltyRule.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      throw new Error("Không tìm thấy quy tắc");
    }
    const before = LoyaltyRulesService.formatRule(existing);
    existing.isDeleted = true;
    existing.status = "archived";
    existing.deletedAt = new Date();
    existing.updatedBy = actor?.id || null;
    await existing.save();

    await LoyaltyRulesService.logAudit(
      existing._id,
      "delete",
      before,
      LoyaltyRulesService.formatRule(existing),
      actor
    );

    return { success: true };
  }
}

module.exports = new LoyaltyRulesService();
