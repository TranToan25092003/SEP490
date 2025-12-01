const db = require("../db");
const { AttendanceService } = require("../../service/attendance.service");
const DomainError = require("../../errors/domainError");

jest.mock("../../service/staff.service", () => ({
  StaffService: {
    getAllStaffIncludingTechnicians: jest.fn(),
  },
}));

const { StaffService } = require("../../service/staff.service");

const SAMPLE_STAFF = [
  {
    technicianClerkId: "tech_1",
    technicianName: "Tech One",
    position: "technician",
  },
  {
    technicianClerkId: "tech_2",
    technicianName: "Tech Two",
    position: "technician",
  },
];

describe("AttendanceService", () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    await db.clearDatabase();
  });

  describe("getDateRange", () => {
    test("UC0001_abnormal_invalid_date_throws_DomainError", () => {
      expect(() => AttendanceService.getDateRange("not-a-date")).toThrow(
        DomainError
      );
      try {
        AttendanceService.getDateRange("not-a-date");
      } catch (error) {
        expect(error.errorCode).toBe("INVALID_DATE");
        expect(error.statusCode).toBe(400);
      }
    });

    test("UC0002_normal_returns_start_of_day_and_next_day_end", () => {
      const dateInput = new Date("2024-05-10T10:30:00Z");

      const { start, end } = AttendanceService.getDateRange(dateInput);

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    test("UC0003_boundary_defaults_to_current_date_normalized", () => {
      const fixedNow = new Date("2024-05-11T15:45:00Z");
      jest.useFakeTimers().setSystemTime(fixedNow);

      const { start, end } = AttendanceService.getDateRange();

      const expectedStart = new Date(fixedNow);
      expectedStart.setHours(0, 0, 0, 0);
      const expectedEnd = new Date(expectedStart);
      expectedEnd.setDate(expectedEnd.getDate() + 1);

      expect(start.getTime()).toBe(expectedStart.getTime());
      expect(end.getTime()).toBe(expectedEnd.getTime());
    });
  });

  describe("ensureAttendanceDocument", () => {
    test("UC0001_normal_creates_attendance_for_missing_day", async () => {
      StaffService.getAllStaffIncludingTechnicians.mockResolvedValue(
        SAMPLE_STAFF
      );

      const dateInput = new Date("2024-05-01T08:00:00Z");
      const attendance = await AttendanceService.ensureAttendanceDocument(
        dateInput
      );

      expect(StaffService.getAllStaffIncludingTechnicians).toHaveBeenCalled();
      expect(attendance.entries).toHaveLength(SAMPLE_STAFF.length);

      const firstEntry = attendance.entries.find(
        (entry) => entry.staffId === SAMPLE_STAFF[0].technicianClerkId
      );
      expect(firstEntry).toMatchObject({
        staffName: SAMPLE_STAFF[0].technicianName,
        position: SAMPLE_STAFF[0].position,
        morningShift: false,
        afternoonShift: false,
        totalWork: 0,
      });

      expect(attendance.stats.totalEmployees).toBe(SAMPLE_STAFF.length);
      expect(attendance.stats.presentMorning).toBe(0);
      expect(attendance.stats.presentAfternoon).toBe(0);
      expect(attendance.stats.fullDay).toBe(0);
    });

    test("UC0002_boundary_syncs_new_staff_and_updates_existing_names", async () => {
      const dateInput = new Date("2024-05-02T08:00:00Z");
      const initialStaff = [SAMPLE_STAFF[0]];

      await AttendanceService.ensureAttendanceDocument(dateInput, initialStaff);

      const updatedStaff = [
        { ...SAMPLE_STAFF[0], technicianName: "Tech One Updated" },
        SAMPLE_STAFF[1],
      ];

      const attendance = await AttendanceService.ensureAttendanceDocument(
        dateInput,
        updatedStaff
      );

      expect(attendance.entries).toHaveLength(2);

      const updatedEntry = attendance.entries.find(
        (entry) => entry.staffId === SAMPLE_STAFF[0].technicianClerkId
      );
      expect(updatedEntry.staffName).toBe("Tech One Updated");

      const newEntry = attendance.entries.find(
        (entry) => entry.staffId === SAMPLE_STAFF[1].technicianClerkId
      );
      expect(newEntry).toMatchObject({
        morningShift: false,
        afternoonShift: false,
        totalWork: 0,
      });

      expect(attendance.stats.totalEmployees).toBe(2);
    });

    test("UC0003_abnormal_invalid_date_input_throws_DomainError", async () => {
      await expect(
        AttendanceService.ensureAttendanceDocument("invalid-date")
      ).rejects.toThrow(DomainError);
      const error = await AttendanceService.ensureAttendanceDocument(
        "invalid-date"
      ).catch((e) => e);
      expect(error.errorCode).toBe("INVALID_DATE");
    });
  });

  describe("saveDailyAttendance", () => {
    test("UC0001_abnormal_requires_date_field", async () => {
      const promise = AttendanceService.saveDailyAttendance({});

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });

    test("UC0002_normal_merges_entries_recalculates_stats_and_marks_saved", async () => {
      const dateInput = new Date("2024-05-03T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      const payload = {
        date: dateInput,
        entries: [
          { staffId: "tech_1", morningShift: true, afternoonShift: true },
          { staffId: "tech_2", afternoonShift: true },
        ],
        status: "saved",
        savedBy: "manager_123",
      };

      const attendance = await AttendanceService.saveDailyAttendance(payload);

      const entryOne = attendance.entries.find(
        (entry) => entry.staffId === "tech_1"
      );
      const entryTwo = attendance.entries.find(
        (entry) => entry.staffId === "tech_2"
      );

      expect(entryOne.totalWork).toBe(1);
      expect(entryTwo.totalWork).toBe(0.5);

      expect(attendance.stats.totalEmployees).toBe(2);
      expect(attendance.stats.presentMorning).toBe(1);
      expect(attendance.stats.presentAfternoon).toBe(2);
      expect(attendance.stats.fullDay).toBe(1);

      expect(attendance.status).toBe("saved");
      expect(attendance.savedBy).toBe("manager_123");
      expect(attendance.savedAt).toBeInstanceOf(Date);
    });

    test("UC0003_boundary_defaults_status_and_stats_when_no_updates", async () => {
      const dateInput = new Date("2024-05-03T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      const attendance = await AttendanceService.saveDailyAttendance({
        date: dateInput,
      });

      expect(attendance.status).toBe("saved");
      expect(attendance.stats.totalEmployees).toBe(SAMPLE_STAFF.length);
      expect(attendance.stats.presentMorning).toBe(0);
      expect(attendance.stats.presentAfternoon).toBe(0);
      expect(attendance.stats.fullDay).toBe(0);
      expect(attendance.savedAt).toBeInstanceOf(Date);
    });
  });

  describe("markShiftForAll", () => {
    test("UC0001_normal_marks_all_entries_for_shift", async () => {
      const dateInput = new Date("2024-05-04T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      const attendanceAfterMark = await AttendanceService.markShiftForAll({
        date: dateInput,
        shift: "morningShift",
        value: true,
      });

      attendanceAfterMark.entries.forEach((entry) => {
        expect(entry.morningShift).toBe(true);
        expect(entry.totalWork).toBe(0.5);
      });
      expect(attendanceAfterMark.status).toBe("draft");
      expect(attendanceAfterMark.stats.presentMorning).toBe(
        SAMPLE_STAFF.length
      );
    });

    test("UC0002_abnormal_invalid_shift_value", async () => {
      const dateInput = new Date("2024-05-04T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      const promise = AttendanceService.markShiftForAll({
        date: dateInput,
        shift: "eveningShift",
        value: true,
      });

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("INVALID_SHIFT");
    });

    test("UC0003_boundary_missing_date_throws_DomainError", async () => {
      const promise = AttendanceService.markShiftForAll({
        date: null,
        shift: "morningShift",
        value: false,
      });

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });
  });

  describe("resetAttendance", () => {
    test("UC0001_abnormal_missing_date_throws_DomainError", async () => {
      const promise = AttendanceService.resetAttendance(null);

      await expect(promise).rejects.toThrow(DomainError);
      const error = await promise.catch((e) => e);
      expect(error.errorCode).toBe("DATE_REQUIRED");
    });

    test("UC0002_boundary_no_shifts_set_results_in_zero_stats", async () => {
      const dateInput = new Date("2024-05-05T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      const attendanceAfterReset = await AttendanceService.resetAttendance(
        dateInput
      );

      attendanceAfterReset.entries.forEach((entry) => {
        expect(entry.morningShift).toBe(false);
        expect(entry.afternoonShift).toBe(false);
        expect(entry.totalWork).toBe(0);
      });
      expect(attendanceAfterReset.stats.presentMorning).toBe(0);
      expect(attendanceAfterReset.stats.presentAfternoon).toBe(0);
      expect(attendanceAfterReset.stats.fullDay).toBe(0);
      expect(attendanceAfterReset.status).toBe("draft");
    });

    test("UC0003_normal_resets_after_shifts_marked", async () => {
      const dateInput = new Date("2024-05-05T08:00:00Z");
      await AttendanceService.ensureAttendanceDocument(dateInput, SAMPLE_STAFF);

      await AttendanceService.markShiftForAll({
        date: dateInput,
        shift: "afternoonShift",
        value: true,
      });

      const attendanceAfterReset = await AttendanceService.resetAttendance(
        dateInput
      );

      attendanceAfterReset.entries.forEach((entry) => {
        expect(entry.morningShift).toBe(false);
        expect(entry.afternoonShift).toBe(false);
        expect(entry.totalWork).toBe(0);
      });
      expect(attendanceAfterReset.stats.presentMorning).toBe(0);
      expect(attendanceAfterReset.stats.presentAfternoon).toBe(0);
      expect(attendanceAfterReset.stats.fullDay).toBe(0);
      expect(attendanceAfterReset.status).toBe("draft");
    });
  });
});
