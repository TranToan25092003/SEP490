const db = require("../db");
const { AttendanceService } = require("../../service/attendance.service");
const mongoose = require("mongoose");
const { Attendance } = require("../../model");
const DomainError = require("../../errors/domainError");

// Mock StaffService
jest.mock("../../service/staff.service");

const { StaffService } = require("../../service/staff.service");

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.closeDatabase();
});

afterEach(async () => {
  await db.clearDatabase();
});

describe("AttendanceService", () => {
  const STAFF_LIST = [
    {
      technicianClerkId: "staff_001",
      technicianName: "Nguyễn Văn A",
      position: "Technician",
    },
    {
      technicianClerkId: "staff_002",
      technicianName: "Trần Thị B",
      position: "Senior Technician",
    },
    {
      technicianClerkId: "staff_003",
      technicianName: "Lê Văn C",
      position: "Technician",
    },
  ];

  beforeEach(() => {
    StaffService.getAllStaffIncludingTechnicians = jest
      .fn()
      .mockResolvedValue(STAFF_LIST);
  });

  describe("getDailyAttendance", () => {
    const DATES = [
      new Date("2025-11-25T00:00:00.000Z"), // UC0001, UC0002, UC0003
      new Date("2025-11-26T00:00:00.000Z"), // UC0004
      new Date("invalid-date"), // UC0005
    ];

    test("UC0001_returnsExistingAttendanceDocument", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      await Attendance.collection.insertOne({
        date: start,
        entries: [
          {
            staffId: "staff_001",
            staffName: "Nguyễn Văn A",
            position: "Technician",
            morningShift: true,
            afternoonShift: false,
            totalWork: 0.5,
          },
        ],
        stats: {
          totalEmployees: 1,
          presentMorning: 1,
          presentAfternoon: 0,
          fullDay: 0,
        },
        status: "draft",
      });

      const result = await AttendanceService.getDailyAttendance(date);

      expect(result).toBeDefined();
      expect(result.date.toISOString()).toBe(start.toISOString());
      expect(result.entries.length).toBe(1);
      expect(result.entries[0].staffId).toBe("staff_001");
    });

    test("UC0002_createsNewAttendanceDocumentWhenNotExists", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const result = await AttendanceService.getDailyAttendance(date);

      expect(result).toBeDefined();
      expect(result.date.toISOString()).toBe(start.toISOString());
      expect(result.entries.length).toBe(STAFF_LIST.length);
      expect(result.entries[0].staffId).toBe("staff_001");
      expect(result.entries[0].morningShift).toBe(false);
      expect(result.entries[0].afternoonShift).toBe(false);
      expect(result.stats.totalEmployees).toBe(STAFF_LIST.length);
    });

    test("UC0003_syncsEntriesWithStaffList", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      // Tạo attendance với 1 entry cũ (staff không còn trong danh sách)
      await Attendance.collection.insertOne({
        date: start,
        entries: [
          {
            staffId: "staff_old",
            staffName: "Nhân viên cũ",
            position: "Technician",
            morningShift: false,
            afternoonShift: false,
            totalWork: 0,
          },
        ],
        stats: {
          totalEmployees: 1,
          presentMorning: 0,
          presentAfternoon: 0,
          fullDay: 0,
        },
        status: "draft",
      });

      const result = await AttendanceService.getDailyAttendance(date);

      expect(result).toBeDefined();
      // Phải có đủ 3 staff từ STAFF_LIST
      expect(result.entries.length).toBe(STAFF_LIST.length);
      // Kiểm tra staff mới được thêm vào
      const staff001 = result.entries.find((e) => e.staffId === "staff_001");
      expect(staff001).toBeDefined();
      expect(staff001.staffName).toBe("Nguyễn Văn A");
    });

    test("UC0004_handlesNullDateInput", async () => {
      const result = await AttendanceService.getDailyAttendance(null);

      expect(result).toBeDefined();
      expect(result.entries.length).toBe(STAFF_LIST.length);
    });

    test("UC0005_throwsErrorForInvalidDate", async () => {
      const promise = AttendanceService.getDailyAttendance(DATES[2]);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("INVALID_DATE");
    });
  });

  describe("saveDailyAttendance", () => {
    const DATES = [
      new Date("2025-11-25T00:00:00.000Z"), // UC0001, UC0002, UC0003, UC0004
      null, // UC0005
    ];

    test("UC0001_savesAttendanceWithEntries", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const payload = {
        date: date,
        entries: [
          {
            staffId: "staff_001",
            staffName: "Nguyễn Văn A",
            position: "Technician",
            morningShift: true,
            afternoonShift: true,
            notes: "Làm đủ ca",
          },
          {
            staffId: "staff_002",
            staffName: "Trần Thị B",
            position: "Senior Technician",
            morningShift: true,
            afternoonShift: false,
          },
        ],
        status: "saved",
        savedBy: "manager_001",
      };

      const result = await AttendanceService.saveDailyAttendance(payload);

      expect(result).toBeDefined();
      expect(result.status).toBe("saved");
      expect(result.savedBy).toBe("manager_001");
      expect(result.savedAt).toBeDefined();
      expect(result.entries.length).toBeGreaterThanOrEqual(2);

      const entry1 = result.entries.find((e) => e.staffId === "staff_001");
      expect(entry1).toBeDefined();
      expect(entry1.morningShift).toBe(true);
      expect(entry1.afternoonShift).toBe(true);
      expect(entry1.totalWork).toBe(1);
      expect(entry1.notes).toBe("Làm đủ ca");
    });

    test("UC0002_updatesExistingAttendanceDocument", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      await Attendance.collection.insertOne({
        date: start,
        entries: [
          {
            staffId: "staff_001",
            staffName: "Nguyễn Văn A",
            position: "Technician",
            morningShift: false,
            afternoonShift: false,
            totalWork: 0,
          },
        ],
        stats: {
          totalEmployees: 1,
          presentMorning: 0,
          presentAfternoon: 0,
          fullDay: 0,
        },
        status: "draft",
      });

      const payload = {
        date: date,
        entries: [
          {
            staffId: "staff_001",
            morningShift: true,
            afternoonShift: true,
          },
        ],
        status: "saved",
        savedBy: "manager_001",
      };

      const result = await AttendanceService.saveDailyAttendance(payload);

      expect(result).toBeDefined();
      expect(result.status).toBe("saved");
      const entry1 = result.entries.find((e) => e.staffId === "staff_001");
      expect(entry1.morningShift).toBe(true);
      expect(entry1.afternoonShift).toBe(true);
      expect(entry1.totalWork).toBe(1);
    });

    test("UC0003_calculatesStatsCorrectly", async () => {
      const date = DATES[0];
      const payload = {
        date: date,
        entries: [
          {
            staffId: "staff_001",
            morningShift: true,
            afternoonShift: true, // full day
          },
          {
            staffId: "staff_002",
            morningShift: true,
            afternoonShift: false, // morning only
          },
          {
            staffId: "staff_003",
            morningShift: false,
            afternoonShift: true, // afternoon only
          },
        ],
        status: "saved",
      };

      const result = await AttendanceService.saveDailyAttendance(payload);

      expect(result.stats).toBeDefined();
      expect(result.stats.totalEmployees).toBeGreaterThanOrEqual(3);
      expect(result.stats.presentMorning).toBe(2); // staff_001, staff_002
      expect(result.stats.presentAfternoon).toBe(2); // staff_001, staff_003
      expect(result.stats.fullDay).toBe(1); // staff_001
    });

    test("UC0004_savesAsDraftWhenStatusNotProvided", async () => {
      const date = DATES[0];
      const payload = {
        date: date,
        entries: [
          {
            staffId: "staff_001",
            morningShift: true,
            afternoonShift: false,
          },
        ],
      };

      const result = await AttendanceService.saveDailyAttendance(payload);

      expect(result).toBeDefined();
      expect(result.status).toBe("saved"); // Default status
    });

    test("UC0005_throwsErrorWhenDateMissing", async () => {
      const payload = {
        entries: [
          {
            staffId: "staff_001",
            morningShift: true,
          },
        ],
      };

      const promise = AttendanceService.saveDailyAttendance(payload);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });
  });

  describe("markShiftForAll", () => {
    const DATES = [
      new Date("2025-11-25T00:00:00.000Z"), // UC0001, UC0002, UC0003, UC0004
      null, // UC0005
    ];

    test("UC0001_marksMorningShiftForAll", async () => {
      const date = DATES[0];
      const payload = {
        date: date,
        shift: "morningShift",
        value: true,
      };

      const result = await AttendanceService.markShiftForAll(payload);

      expect(result).toBeDefined();
      expect(result.entries.every((e) => e.morningShift === true)).toBe(true);
      expect(result.entries.every((e) => e.afternoonShift === false)).toBe(true);
      expect(result.entries.every((e) => e.totalWork === 0.5)).toBe(true);
      expect(result.status).toBe("draft");
      expect(result.stats.presentMorning).toBe(result.entries.length);
    });

    test("UC0002_marksAfternoonShiftForAll", async () => {
      const date = DATES[0];
      const payload = {
        date: date,
        shift: "afternoonShift",
        value: true,
      };

      const result = await AttendanceService.markShiftForAll(payload);

      expect(result).toBeDefined();
      expect(result.entries.every((e) => e.afternoonShift === true)).toBe(true);
      expect(result.entries.every((e) => e.morningShift === false)).toBe(true);
      expect(result.entries.every((e) => e.totalWork === 0.5)).toBe(true);
      expect(result.stats.presentAfternoon).toBe(result.entries.length);
    });

    test("UC0003_unmarksShiftForAll", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      // Tạo attendance với tất cả staff có morningShift = true
      await Attendance.collection.insertOne({
        date: start,
        entries: STAFF_LIST.map((staff) => ({
          staffId: staff.technicianClerkId,
          staffName: staff.technicianName,
          position: staff.position,
          morningShift: true,
          afternoonShift: false,
          totalWork: 0.5,
        })),
        stats: {
          totalEmployees: STAFF_LIST.length,
          presentMorning: STAFF_LIST.length,
          presentAfternoon: 0,
          fullDay: 0,
        },
        status: "draft",
      });

      const payload = {
        date: date,
        shift: "morningShift",
        value: false,
      };

      const result = await AttendanceService.markShiftForAll(payload);

      expect(result).toBeDefined();
      expect(result.entries.every((e) => e.morningShift === false)).toBe(true);
      expect(result.entries.every((e) => e.totalWork === 0)).toBe(true);
      expect(result.stats.presentMorning).toBe(0);
    });

    test("UC0004_throwsErrorForInvalidShift", async () => {
      const date = DATES[0];
      const payload = {
        date: date,
        shift: "nightShift",
        value: true,
      };

      const promise = AttendanceService.markShiftForAll(payload);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("INVALID_SHIFT");
    });

    test("UC0005_throwsErrorWhenDateMissing", async () => {
      const payload = {
        shift: "morningShift",
        value: true,
      };

      const promise = AttendanceService.markShiftForAll(payload);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });
  });

  describe("resetAttendance", () => {
    const DATES = [
      new Date("2025-11-25T00:00:00.000Z"), // UC0001, UC0002
      null, // UC0003
    ];

    test("UC0001_resetsAllShiftsToFalse", async () => {
      const date = DATES[0];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      // Tạo attendance với một số staff đã điểm danh
      await Attendance.collection.insertOne({
        date: start,
        entries: [
          {
            staffId: "staff_001",
            staffName: "Nguyễn Văn A",
            position: "Technician",
            morningShift: true,
            afternoonShift: true,
            totalWork: 1,
          },
          {
            staffId: "staff_002",
            staffName: "Trần Thị B",
            position: "Senior Technician",
            morningShift: true,
            afternoonShift: false,
            totalWork: 0.5,
          },
        ],
        stats: {
          totalEmployees: 2,
          presentMorning: 2,
          presentAfternoon: 1,
          fullDay: 1,
        },
        status: "saved",
      });

      const result = await AttendanceService.resetAttendance(date);

      expect(result).toBeDefined();
      expect(result.entries.every((e) => e.morningShift === false)).toBe(true);
      expect(result.entries.every((e) => e.afternoonShift === false)).toBe(true);
      expect(result.entries.every((e) => e.totalWork === 0)).toBe(true);
      expect(result.status).toBe("draft");
      expect(result.stats.presentMorning).toBe(0);
      expect(result.stats.presentAfternoon).toBe(0);
      expect(result.stats.fullDay).toBe(0);
    });

    test("UC0002_createsNewDocumentIfNotExists", async () => {
      const date = DATES[0];

      const result = await AttendanceService.resetAttendance(date);

      expect(result).toBeDefined();
      expect(result.entries.length).toBe(STAFF_LIST.length);
      expect(result.entries.every((e) => e.morningShift === false)).toBe(true);
      expect(result.entries.every((e) => e.afternoonShift === false)).toBe(true);
    });

    test("UC0003_throwsErrorWhenDateMissing", async () => {
      const promise = AttendanceService.resetAttendance(DATES[1]);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });
  });

  describe("getHistory", () => {
    const START_DATES = [
      new Date("2025-11-20T00:00:00.000Z"), // UC0001, UC0002, UC0003
      new Date("2025-11-25T00:00:00.000Z"), // UC0004
      new Date("invalid-date"), // UC0005
    ];

    const END_DATES = [
      new Date("2025-11-25T23:59:59.999Z"), // UC0001, UC0002, UC0004
      new Date("2025-11-20T23:59:59.999Z"), // UC0003
      new Date("invalid-date"), // UC0005
    ];

    test("UC0001_returnsAttendanceHistoryInDateRange", async () => {
      const startDate = START_DATES[0];
      const endDate = END_DATES[0];

      // Tạo một số attendance documents
      const dates = [
        new Date("2025-11-21T00:00:00.000Z"),
        new Date("2025-11-22T00:00:00.000Z"),
        new Date("2025-11-23T00:00:00.000Z"),
      ];

      for (const date of dates) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        await Attendance.collection.insertOne({
          date: start,
          entries: [],
          stats: {
            totalEmployees: 0,
            presentMorning: 0,
            presentAfternoon: 0,
            fullDay: 0,
          },
          status: "draft",
        });
      }

      const result = await AttendanceService.getHistory({
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      // Sắp xếp theo date giảm dần
      expect(result[0].date.getTime()).toBeGreaterThanOrEqual(
        result[1].date.getTime()
      );
    });

    test("UC0002_returnsEmptyArrayWhenNoAttendanceInRange", async () => {
      const startDate = START_DATES[0];
      const endDate = END_DATES[0];

      const result = await AttendanceService.getHistory({
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("UC0003_throwsErrorWhenStartDateAfterEndDate", async () => {
      const startDate = START_DATES[1];
      const endDate = END_DATES[1];

      const promise = AttendanceService.getHistory({
        startDate,
        endDate,
      });

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("INVALID_DATE_RANGE");
    });

    test("UC0004_handlesNullDatesDefaultsToToday", async () => {
      const result = await AttendanceService.getHistory({
        startDate: null,
        endDate: null,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test("UC0005_throwsErrorForInvalidDate", async () => {
      const promise = AttendanceService.getHistory({
        startDate: START_DATES[2],
        endDate: END_DATES[2],
      });

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("INVALID_DATE_RANGE");
    });
  });
});


