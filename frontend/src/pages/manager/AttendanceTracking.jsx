import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
  getAttendanceByDate,
  markShiftForAll,
  resetAttendanceByDate,
  saveAttendanceByDate,
} from "@/api/attendance";

const DEFAULT_STATS = {
  totalEmployees: 0,
  presentMorning: 0,
  presentAfternoon: 0,
  fullDay: 0,
};

const calculateTotalWork = (entry) => {
  let total = 0;
  if (entry.morningShift) total += 0.5;
  if (entry.afternoonShift) total += 0.5;
  return total;
};

const hydrateEntries = (entries = []) =>
  entries.map((entry) => ({
    ...entry,
    totalWork: calculateTotalWork(entry),
  }));

const deriveStats = (entries = []) => {
  if (!entries.length) {
    return { ...DEFAULT_STATS };
  }

  const presentMorning = entries.filter((entry) => entry.morningShift).length;
  const presentAfternoon = entries.filter(
    (entry) => entry.afternoonShift
  ).length;
  const fullDay = entries.filter(
    (entry) => entry.morningShift && entry.afternoonShift
  ).length;

  return {
    totalEmployees: entries.length,
    presentMorning,
    presentAfternoon,
    fullDay,
  };
};

const formatPercentage = (value, total) => {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

const AttendanceTracking = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const syncEntries = useCallback((payload) => {
    if (!payload) {
      setAttendanceData([]);
      return;
    }
    setAttendanceData(hydrateEntries(payload.entries || []));
  }, []);

  const fetchAttendance = useCallback(
    async (date) => {
      setIsLoading(true);
      try {
        const data = await getAttendanceByDate(date);
        syncEntries(data);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
        toast.error("Không thể tải dữ liệu điểm danh");
      } finally {
        setIsLoading(false);
      }
    },
    [syncEntries]
  );

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  const stats = useMemo(() => deriveStats(attendanceData), [attendanceData]);

  const handleAttendanceChange = (staffId, shiftKey) => {
    setAttendanceData((prev) =>
      prev.map((entry) => {
        if (entry.staffId !== staffId) return entry;
        const nextEntry = {
          ...entry,
          [shiftKey]: !entry[shiftKey],
        };

        return {
          ...nextEntry,
          totalWork: calculateTotalWork(nextEntry),
        };
      })
    );
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const data = await saveAttendanceByDate({
        date: selectedDate,
        status: "saved",
        savedBy: "manager_portal",
        entries: attendanceData,
      });
      syncEntries(data);
      toast.success("Đã lưu điểm danh thành công");
    } catch (error) {
      console.error("Failed to save attendance", error);
      toast.error("Không thể lưu điểm danh, vui lòng thử lại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAll = async (shiftKey) => {
    setIsActionLoading(true);
    try {
      const data = await markShiftForAll({
        date: selectedDate,
        shift: shiftKey,
        value: true,
      });
      syncEntries(data);
      toast.success(
        `Đã điểm danh tất cả ${
          shiftKey === "morningShift" ? "ca sáng" : "ca chiều"
        }`
      );
    } catch (error) {
      console.error("Failed to update shift", error);
      toast.error("Không thể cập nhật trạng thái ca");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetAttendance = async () => {
    setIsActionLoading(true);
    try {
      const data = await resetAttendanceByDate(selectedDate);
      syncEntries(data);
      toast.info("Đã xóa tất cả trạng thái điểm danh");
    } catch (error) {
      console.error("Failed to reset attendance", error);
      toast.error("Không thể xóa trạng thái điểm danh");
    } finally {
      setIsActionLoading(false);
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(selectedDate).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell
            colSpan={6}
            className="text-center py-8 text-muted-foreground"
          >
            Đang tải dữ liệu...
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow>
        <TableCell
          colSpan={6}
          className="text-center py-8 text-muted-foreground"
        >
          Không có nhân viên nào cho ngày này
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Theo dõi điểm danh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý trạng thái chấm công theo ca trong ngày
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ngày làm việc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Chọn ngày"
              label="Ngày điểm danh"
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleMarkAll("morningShift")}
              variant="outline"
              disabled={isActionLoading || isLoading}
            >
              Điểm danh tất cả ca sáng
            </Button>
            <Button
              onClick={() => handleMarkAll("afternoonShift")}
              variant="outline"
              disabled={isActionLoading || isLoading}
            >
              Điểm danh tất cả ca chiều
            </Button>
            <Button
              onClick={handleResetAttendance}
              variant="outline"
              disabled={isActionLoading || isLoading}
            >
              Xóa tất cả
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tổng nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalEmployees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Có mặt ca sáng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.presentMorning}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(stats.presentMorning, stats.totalEmployees)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Có mặt ca chiều
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stats.presentAfternoon}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(stats.presentAfternoon, stats.totalEmployees)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Đủ công (2 ca)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {stats.fullDay}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(stats.fullDay, stats.totalEmployees)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bảng điểm danh</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead className="text-center">Ca sáng</TableHead>
                <TableHead className="text-center">Ca chiều</TableHead>
                <TableHead className="text-center">Tổng công</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.length
                ? attendanceData.map((employee, index) => (
                    <TableRow key={employee.staffId}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {employee.staffName}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          className={"border-2 border-black"}
                          checked={!!employee.morningShift}
                          onCheckedChange={() =>
                            handleAttendanceChange(
                              employee.staffId,
                              "morningShift"
                            )
                          }
                          disabled={isLoading || isActionLoading}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          className={"border-2 border-black"}
                          checked={!!employee.afternoonShift}
                          onCheckedChange={() =>
                            handleAttendanceChange(
                              employee.staffId,
                              "afternoonShift"
                            )
                          }
                          disabled={isLoading || isActionLoading}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            employee.totalWork === 1
                              ? "text-green-600"
                              : employee.totalWork === 0.5
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {employee.totalWork} công
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                : renderEmptyState()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveAttendance}
          disabled={isSaving || isLoading || !attendanceData.length}
          size="lg"
        >
          {isSaving ? "Đang lưu..." : "Lưu điểm danh"}
        </Button>
      </div>
    </div>
  );
};

export default AttendanceTracking;
