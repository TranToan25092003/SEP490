const { AttendanceService } = require("../service/attendance.service");

class AttendanceController {
  async getAttendanceByDate(req, res, next) {
    try {
      const { date } = req.query;
      const attendance = await AttendanceService.getDailyAttendance(date);

      return res.status(200).json({
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveAttendance(req, res, next) {
    try {
      const attendance = await AttendanceService.saveDailyAttendance(req.body);

      return res.status(200).json({
        message: "Lưu điểm danh thành công",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async markShiftForAll(req, res, next) {
    try {
      const attendance = await AttendanceService.markShiftForAll(req.body);

      return res.status(200).json({
        message: "Đã cập nhật trạng thái ca cho toàn bộ nhân viên",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetAttendance(req, res, next) {
    try {
      const attendance = await AttendanceService.resetAttendance(req.body.date);

      return res.status(200).json({
        message: "Đã xóa trạng thái điểm danh của ngày",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const history = await AttendanceService.getHistory({ startDate, endDate });

      return res.status(200).json({
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
