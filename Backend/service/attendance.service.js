const DomainError = require("../errors/domainError");
const { Attendance } = require("../model");
const { StaffService } = require("./staff.service");

class AttendanceService {
  getDateRange(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date();

    if (Number.isNaN(date.getTime())) {
      throw new DomainError("Ngày không hợp lệ", "INVALID_DATE", 400);
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  calculateTotalWork(entry) {
    let total = 0;
    if (entry.morningShift) total += 0.5;
    if (entry.afternoonShift) total += 0.5;
    return total;
  }

  computeStats(entries) {
    const presentMorning = entries.filter((entry) => entry.morningShift).length;
    const presentAfternoon = entries.filter((entry) => entry.afternoonShift).length;
    const fullDay = entries.filter(
      (entry) => entry.morningShift && entry.afternoonShift
    ).length;

    return {
      totalEmployees: entries.length,
      presentMorning,
      presentAfternoon,
      fullDay,
    };
  }

  mapTechnicianToEntry(technician) {
    return {
      staffId: technician.technicianClerkId,
      staffName: technician.technicianName,
      position: technician.position || "Technician",
      morningShift: false,
      afternoonShift: false,
      totalWork: 0,
    };
  }

  syncEntriesWithStaffList(entries = [], staffList = []) {
    const entryMap = new Map(entries.map((entry) => [entry.staffId, entry]));
    let mutated = false;

    staffList.forEach((staff) => {
      const existing = entryMap.get(staff.technicianClerkId);

      if (!existing) {
        entryMap.set(staff.technicianClerkId, this.mapTechnicianToEntry(staff));
        mutated = true;
        return;
      }

      const desiredName = staff.technicianName;
      const desiredPosition = staff.position || existing.position;

      if (existing.staffName !== desiredName || existing.position !== desiredPosition) {
        existing.staffName = desiredName;
        existing.position = desiredPosition;
        mutated = true;
      }
    });

    return {
      entries: Array.from(entryMap.values()),
      mutated,
    };
  }

  mergeEntries(baseEntries = [], updates = []) {
    const entryMap = new Map(
      baseEntries.map((entry) => [entry.staffId, { ...entry }])
    );

    updates.forEach((update) => {
      if (!update.staffId) {
        return;
      }

      const target =
        entryMap.get(update.staffId) ||
        {
          staffId: update.staffId,
          staffName: update.staffName || "Chưa xác định",
          position: update.position || "Technician",
          morningShift: false,
          afternoonShift: false,
          totalWork: 0,
        };

      if (typeof update.staffName === "string" && update.staffName.trim()) {
        target.staffName = update.staffName.trim();
      }

      if (typeof update.position === "string" && update.position.trim()) {
        target.position = update.position.trim();
      }

      if (typeof update.morningShift === "boolean") {
        target.morningShift = update.morningShift;
      }

      if (typeof update.afternoonShift === "boolean") {
        target.afternoonShift = update.afternoonShift;
      }

      if (typeof update.notes === "string") {
        target.notes = update.notes;
      }

      target.totalWork = this.calculateTotalWork(target);
      entryMap.set(target.staffId, target);
    });

    return Array.from(entryMap.values());
  }

  async ensureAttendanceDocument(dateInput) {
    const { start, end } = this.getDateRange(dateInput);
    let attendance = await Attendance.findOne({ date: { $gte: start, $lt: end } });
    const staffList = await StaffService.getAllTechnicians();

    if (!attendance) {
      const entries = staffList.map((staff) => this.mapTechnicianToEntry(staff));
      attendance = await Attendance.create({
        date: start,
        entries,
        stats: this.computeStats(entries),
      });
      return attendance;
    }

    const { entries, mutated } = this.syncEntriesWithStaffList(
      attendance.entries,
      staffList
    );

    if (mutated) {
      attendance.entries = entries.map((entry) => ({
        ...entry,
        totalWork: this.calculateTotalWork(entry),
      }));
      attendance.stats = this.computeStats(attendance.entries);
      await attendance.save();
    }

    return attendance;
  }

  async getDailyAttendance(dateInput) {
    const attendance = await this.ensureAttendanceDocument(dateInput);
    return attendance;
  }

  async saveDailyAttendance(payload) {
    if (!payload?.date) {
      throw new DomainError("Thiếu ngày điểm danh", "DATE_REQUIRED", 400);
    }

    const attendance = await this.ensureAttendanceDocument(payload.date);
    const mergedEntries = this.mergeEntries(attendance.entries, payload.entries || []);
    const recalculatedEntries = mergedEntries.map((entry) => ({
      ...entry,
      totalWork: this.calculateTotalWork(entry),
    }));

    attendance.entries = recalculatedEntries;
    attendance.stats = this.computeStats(recalculatedEntries);
    attendance.status = payload.status || "saved";

    if (attendance.status === "saved") {
      attendance.savedAt = new Date();
      attendance.savedBy = payload.savedBy;
    }

    await attendance.save();
    return attendance;
  }

  async markShiftForAll({ date, shift, value }) {
    if (!date) {
      throw new DomainError("Thiếu ngày điểm danh", "DATE_REQUIRED", 400);
    }

    if (!["morningShift", "afternoonShift"].includes(shift)) {
      throw new DomainError("Ca làm không hợp lệ", "INVALID_SHIFT", 400);
    }

    const attendance = await this.ensureAttendanceDocument(date);
    attendance.entries = attendance.entries.map((entry) => {
      const nextEntry = {
        ...entry,
        [shift]: value,
      };
      nextEntry.totalWork = this.calculateTotalWork(nextEntry);
      return nextEntry;
    });

    attendance.stats = this.computeStats(attendance.entries);
    attendance.status = "draft";
    await attendance.save();

    return attendance;
  }

  async resetAttendance(date) {
    if (!date) {
      throw new DomainError("Thiếu ngày điểm danh", "DATE_REQUIRED", 400);
    }

    const attendance = await this.ensureAttendanceDocument(date);
    attendance.entries = attendance.entries.map((entry) => ({
      ...entry,
      morningShift: false,
      afternoonShift: false,
      totalWork: 0,
    }));

    attendance.stats = this.computeStats(attendance.entries);
    attendance.status = "draft";
    await attendance.save();

    return attendance;
  }

  async getHistory({ startDate, endDate }) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new DomainError("Khoảng ngày không hợp lệ", "INVALID_DATE_RANGE", 400);
    }

    if (start > end) {
      throw new DomainError("Ngày bắt đầu phải nhỏ hơn ngày kết thúc", "INVALID_DATE_RANGE", 400);
    }

    const history = await Attendance.find({
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ date: -1 })
      .lean();

    return history;
  }
}

module.exports = {
  AttendanceService: new AttendanceService(),
};
