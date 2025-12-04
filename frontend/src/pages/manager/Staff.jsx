import React, { useEffect, useMemo, useState } from "react";
import { useOrganization, OrganizationProfile } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { getAttendanceByDate, getAttendanceHistory } from "@/api/attendance";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

const ROLE_LABELS = {
  technician: "Thợ",
  staff: "Nhân Viên",
};

const ATTENDANCE_STATUS_LABELS = {
  full: { text: "đang làm", classes: "bg-green-100 text-green-700" },
  partial: {
    text: "đang làm",
    classes: "bg-yellow-100 text-yellow-700",
  },
  absent: { text: "nghỉ", classes: "bg-red-100 text-red-700" },
  unknown: { text: "chưa điểm danh", classes: "bg-gray-100 text-gray-600" },
};

const ATTENDANCE_HISTORY_DAYS = 30;

const formatHistoryDate = (value) => {
  if (!value) return "Chưa rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const buildHistoryRange = (days = ATTENDANCE_HISTORY_DAYS) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const toISO = (date) => date.toISOString().split("T")[0];
  const toLabel = (date) =>
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return {
    startISO: toISO(start),
    endISO: toISO(end),
    label: `${toLabel(start)} · ${toLabel(end)}`,
  };
};

const mapHistoryRecordsForStaff = (historyDocs = [], staffId) => {
  if (!staffId || !Array.isArray(historyDocs)) return [];
  return historyDocs
    .map((record) => {
      const entry = (record?.entries || []).find(
        (employee) => employee.staffId === staffId
      );
      if (!entry) return null;
      return {
        date: record.date,
        morningShift: !!entry.morningShift,
        afternoonShift: !!entry.afternoonShift,
        totalWork:
          typeof entry.totalWork === "number"
            ? entry.totalWork
            : Number(!!entry.morningShift) * 0.5 +
              Number(!!entry.afternoonShift) * 0.5,
        notes: entry.notes,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const deriveAttendanceStatusKey = (entry) => {
  if (!entry) return "unknown";
  const { morningShift, afternoonShift } = entry;
  if (morningShift && afternoonShift) return "full";
  if (morningShift || afternoonShift) return "partial";
  return "absent";
};

const StaffPage = () => {
  const { organization, isLoaded } = useOrganization();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOrgManager, setShowOrgManager] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyWindowLabel, setHistoryWindowLabel] = useState("");
  const [historyCache, setHistoryCache] = useState({});
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    gender: "",
  });
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isLoadingStaffMeta, setIsLoadingStaffMeta] = useState(false);

  const hydrateStaff = (member, metadata = {}, publicUserData = {}) => {
    const fallbackFullName = [
      publicUserData.firstName,
      publicUserData.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...member,
      fullName: metadata.fullName || member.fullName || fallbackFullName,
      phone:
        metadata.phone ||
        publicUserData.phoneNumber ||
        member.phone ||
        "",
      address: metadata.address || member.address || "",
      gender: metadata.gender || member.gender || "",
      publicMetadata: metadata,
      publicUserData,
    };
  };

  const fetchMembershipsWithPublicMetadata = async (members = []) => {
    return Promise.all(
      members.map(async (member) => {
        const clerkUserId = member.publicUserData?.userId;
        if (!clerkUserId) return member;
        try {
          const { data } = await customFetch.get(
            `/manager/staff/${clerkUserId}/public-metadata`
          );
          return {
            ...member,
            publicMetadata: {
              ...(member.publicMetadata ?? {}),
              ...(data?.publicMetadata ?? {}),
            },
            publicUserData: {
              ...(member.publicUserData ?? {}),
              ...(data?.publicUserData ?? {}),
            },
          };
        } catch (err) {
          console.error(
            "Failed to fetch public metadata for member:",
            clerkUserId,
            err
          );
          return member;
        }
      })
    );
  };

  const resolveMemberMetadata = (member) => {
    if (!member?.clerkUserId) {
      return { metadata: {}, publicUserData: {} };
    }

    const basePublicUserData = member.publicUserData ?? {};
    const baseMetadata = {
      ...(basePublicUserData.publicMetadata ?? {}),
      ...(member.publicMetadata ?? {}),
    };

    if (Object.keys(baseMetadata).length) {
      return { metadata: baseMetadata, publicUserData: basePublicUserData };
    }

    const membership = memberships.find(
      (m) => m.publicUserData?.userId === member.clerkUserId
    );

    if (!membership) {
      return { metadata: baseMetadata, publicUserData: basePublicUserData };
    }

    const publicUserData = membership.publicUserData ?? {};
    const metadata = {
      ...(publicUserData.publicMetadata ?? {}),
      ...(membership.publicMetadata ?? {}),
    };

    return { metadata, publicUserData };
  };

  const handleDetailOpen = (member) => {
    const { metadata, publicUserData } = resolveMemberMetadata(member);
    const hydratedStaff = hydrateStaff(member, metadata, publicUserData);

    setSelectedStaff(hydratedStaff);
    setIsDetailOpen(true);
    setStaffForm({
      fullName: hydratedStaff.fullName || "",
      phone: hydratedStaff.phone || "",
      address: hydratedStaff.address || "",
      gender: hydratedStaff.gender || "",
    });
    setIsEditingStaff(false);

    if (!member?.clerkUserId) {
      toast.error("Không tìm thấy mã người dùng của Clerk.");
      return;
    }

    setIsLoadingStaffMeta(true);
    customFetch
      .get(`/manager/staff/${member.clerkUserId}/public-metadata`)
      .then(({ data }) => {
        const fetchedMetadata = data?.publicMetadata ?? {};
        const fetchedPublicUserData = data?.publicUserData ?? {};
        const refreshedStaff = hydrateStaff(
          hydratedStaff,
          fetchedMetadata,
          fetchedPublicUserData
        );

        setSelectedStaff(refreshedStaff);
        setStaffForm({
          fullName: refreshedStaff.fullName || "",
          phone:
            fetchedMetadata.phone ||
            fetchedPublicUserData.phoneNumber ||
            "",
          address: fetchedMetadata.address || "",
          gender: fetchedMetadata.gender || "",
        });
      })
      .catch((error) => {
        console.error("Không thể tải public metadata:", error);
        toast.error("Không tải được public metadata của nhân viên.");
      })
      .finally(() => setIsLoadingStaffMeta(false));
  };

  const handleDialogOpenChange = (open) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedStaff(null);
      setHistoryError("");
      setHistoryRecords([]);
      setHistoryLoading(false);
      setIsEditingStaff(false);
      setStaffForm({
        fullName: "",
        phone: "",
        address: "",
        gender: "",
      });
    }
  };

  const handleStaffFormChange = (field, value) => {
    setStaffForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveStaffInfo = async () => {
    if (!selectedStaff?.clerkUserId) {
      toast.error("Không tìm thấy thông tin nhân viên");
      return;
    }

    setIsSavingStaff(true);
    try {
      const publicMetadataPayload = {
        fullName: staffForm.fullName || undefined,
        phone: staffForm.phone || undefined,
        address: staffForm.address || undefined,
        gender: staffForm.gender || undefined,
      };

      await customFetch.patch(
        `/manager/staff/${selectedStaff.clerkUserId}/public-metadata`,
        {
          publicMetadata: publicMetadataPayload,
        }
      );

      toast.success("Cập nhật thông tin nhân viên thành công");
      setIsEditingStaff(false);

      // Cập nhật trực tiếp state với dữ liệu đã lưu (không cần đợi reload)
      // Sử dụng dữ liệu từ form (đã được submit) hoặc giữ nguyên giá trị cũ nếu form trống
      const updatedFullName =
        staffForm.fullName?.trim() || selectedStaff.fullName;
      const updatedPhone = staffForm.phone?.trim() || selectedStaff.phone || "";
      const updatedAddress =
        staffForm.address?.trim() || selectedStaff.address || "";
      const updatedGender = staffForm.gender || selectedStaff.gender || "";

      // Cập nhật memberships trước để trigger lại rows calculation
      setMemberships((prevMemberships) =>
        prevMemberships.map((membership) => {
          if (membership.publicUserData?.userId === selectedStaff.clerkUserId) {
            // Tạo membership mới với publicMetadata đã cập nhật
            const updatedMembership = {
              ...membership,
              publicMetadata: {
                ...(membership.publicMetadata || {}),
                ...(updatedFullName ? { fullName: updatedFullName } : {}),
                ...(updatedPhone ? { phone: updatedPhone } : {}),
                ...(updatedAddress ? { address: updatedAddress } : {}),
                ...(updatedGender ? { gender: updatedGender } : {}),
              },
            };
            return updatedMembership;
          }
          return membership;
        })
      );

      // Cập nhật selectedStaff với dữ liệu mới (sẽ được tính lại từ rows khi memberships thay đổi)
      // Nhưng cũng cập nhật trực tiếp để UI phản hồi ngay
      setSelectedStaff((prev) => ({
        ...prev,
        fullName: updatedFullName,
        phone: updatedPhone || "Chưa cập nhật",
        address: updatedAddress || "Chưa có",
        gender: updatedGender || "—",
      }));

      // Cập nhật lại form với dữ liệu mới
      setStaffForm({
        fullName: updatedFullName,
        phone: updatedPhone,
        address: updatedAddress,
        gender: updatedGender,
      });

      // Reload organization ở background để đồng bộ với Clerk (không chặn UI)
      if (organization) {
        organization.reload().catch((err) => {
          console.error("Failed to reload organization:", err);
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin nhân viên:", error);
      toast.error(
        error.response?.data?.message ||
          "❌ Cập nhật thất bại, vui lòng thử lại!"
      );
    } finally {
      setIsSavingStaff(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!organization) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data } = await organization.getMemberships({ pageSize: 100 });

        if (cancelled) return;

        console.log(data);

        const staffOnly = data.filter(
          (m) => m.roleName === "staff" || m.roleName === "technician"
        );

        console.log(staffOnly);

        const staffWithMetadata = await fetchMembershipsWithPublicMetadata(
          staffOnly
        );
        if (cancelled) return;
        setMemberships(staffWithMetadata);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách nhân viên, hãy thử lại sau."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organization, isLoaded]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getAttendanceByDate(today);
        if (cancelled) return;

        const entries = data?.entries || [];
        const mapped = entries.reduce((acc, entry) => {
          if (entry?.staffId) {
            acc[entry.staffId] = entry;
          }
          return acc;
        }, {});

        setAttendanceMap(mapped);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load attendance for staff table", err);
          setAttendanceMap({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    if (!isDetailOpen) return;
    if (!selectedStaff) {
      setHistoryRecords([]);
      return;
    }

    const staffId = selectedStaff.clerkUserId;
    if (!staffId) {
      setHistoryError(
        "Không tìm thấy mã nhân viên của Clerk để xem lịch sử điểm danh."
      );
      setHistoryRecords([]);
      setHistoryLoading(false);
      return;
    }

    const cached = historyCache[staffId];
    if (cached) {
      setHistoryRecords(cached.records || []);
      setHistoryWindowLabel(cached.windowLabel || "");
      setHistoryError("");
      return;
    }

    let cancelled = false;

    (async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const range = buildHistoryRange();
        setHistoryWindowLabel(range.label);
        const historyDocs = await getAttendanceHistory({
          startDate: range.startISO,
          endDate: range.endISO,
        });
        if (cancelled) return;
        const mappedRecords = mapHistoryRecordsForStaff(historyDocs, staffId);
        setHistoryRecords(mappedRecords);
        setHistoryCache((prev) => ({
          ...prev,
          [staffId]: {
            records: mappedRecords,
            windowLabel: range.label,
          },
        }));
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch attendance history", err);
          setHistoryError(
            err instanceof Error
              ? err.message
              : "Không tìm thấy mã nhân viên của Clerk để xem lịch sử điểm danh."
          );
          setHistoryRecords([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [historyCache, isDetailOpen, selectedStaff]);

  const rows = useMemo(
    () =>
      memberships.map((membership) => {
        const publicUserData = membership.publicUserData ?? {};
        const memberMetadata = {
          ...(membership.publicMetadata ?? {}),
          ...(membership.publicMetadata ?? {}),
        };

        // Ưu tiên hiển thị thông tin cá nhân (publicMetadata) thay vì thông tin từ Google/Facebook
        const fullNameFromMetadata = memberMetadata.fullName;
        const fullNameFromGoogle = [
          publicUserData.firstName,
          publicUserData.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        const fullName =
          fullNameFromMetadata ||
          fullNameFromGoogle ||
          publicUserData.identifier ||
          "Không rõ";

        const jobType = membership.roleName ?? "staff";
        const clerkUserId = publicUserData.userId;
        const attendanceEntry = clerkUserId
          ? attendanceMap[clerkUserId]
          : undefined;
        const attendanceStatusKey = deriveAttendanceStatusKey(attendanceEntry);

        const attendanceStatus =
          ATTENDANCE_STATUS_LABELS[attendanceStatusKey] ||
          ATTENDANCE_STATUS_LABELS.unknown;

        return {
          id: membership.id,
          employeeCode:
            memberMetadata.employeeCode ?? publicUserData.userId ?? "—",
          role: membership.roleName ?? membership.roleName ?? "staff",
          fullName,
          avatar: publicUserData.imageUrl,
          gender: memberMetadata.gender ?? "—",
          phone:
            memberMetadata.phone ??
            publicUserData.phoneNumber ??
            "Chưa cập nhật",
          email:
            publicUserData.emailAddress ??
            publicUserData.identifier ??
            "Chưa cập nhật",
          address: memberMetadata.address ?? "Chưa cập nhật",
          jobTypeLabel: ROLE_LABELS[jobType] ?? "Nhân viên",
          statusLabel: attendanceStatus.text,
          statusClasses: attendanceStatus.classes,
          clerkUserId,
          publicUserData,
          publicMetadata: memberMetadata,
        };
      }),
    [memberships, attendanceMap]
  );

  const historySummary = useMemo(() => {
    const summary = {
      total: historyRecords.length,
      full: 0,
      partial: 0,
      absent: 0,
    };

    historyRecords.forEach((record) => {
      const statusKey = deriveAttendanceStatusKey(record);
      if (statusKey === "full") {
        summary.full += 1;
      } else if (statusKey === "partial") {
        summary.partial += 1;
      } else {
        summary.absent += 1;
      }
    });

    return summary;
  }, [historyRecords]);

  const stats = useMemo(() => {
    const summary = {
      total: memberships.length,
      active: 0,
      inactive: 0,
      roleCounts: {},
    };

    memberships.forEach((membership) => {
      const publicUserData = membership.publicUserData ?? {};
      const memberMetadata = {
        ...(publicUserData.publicMetadata ?? {}),
        ...(membership.publicMetadata ?? {}),
      };

      const status = memberMetadata.employmentStatus ?? "active";
      const jobType = memberMetadata.jobType ?? "staff";

      if (status === "inactive") {
        summary.inactive += 1;
      } else {
        summary.active += 1;
      }

      summary.roleCounts[jobType] = (summary.roleCounts[jobType] || 0) + 1;
    });

    return summary;
  }, [memberships]);

  if (loading) {
    return <div className="p-6">Đang tải danh sách nhân viên…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>
        <div className="text-center">
          <button
            onClick={() => setShowOrgManager(!showOrgManager)}
            className="rounded-lg bg-green-600 px-5 py-2 text-white font-medium shadow hover:bg-green-700 transition"
          >
            {showOrgManager ? "Ẩn quản lý tổ chức" : "Hiện quản lý tổ chức"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Tổng số nhân viên</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Đang làm việc</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {stats.active}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Đã nghỉ</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {stats.inactive}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Phân bố vai trò</p>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            {Object.entries(stats.roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span>{ROLE_LABELS[role] ?? role}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(stats.roleCounts).length === 0 && (
              <span className="text-gray-400">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
      </div>

      {showOrgManager && organization && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3 w-full">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Quản lý tổ chức
            </h2>
            <p className="text-sm text-gray-500">
              Cập nhật vai trò hoặc mời nhân viên mới ngay trong trang này.
            </p>
          </div>
          <div className="w-full flex items-center justify-center ">
            <OrganizationProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none p-0 border-0 w-full",
                  headerTitle: "text-center",
                  headerSubtitle: "text-center text-gray-500",
                  profileSection__danger: "hidden", // Ẩn phần xoá tổ chức
                },
                variables: {
                  colorPrimary: "#2563eb",
                },
              }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Họ &amp; tên</th>
              <th className="px-4 py-3 text-left">Giới tính</th>
              <th className="px-4 py-3 text-left">Số điện thoại</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Địa chỉ</th>
              <th className="px-4 py-3 text-left">Vai trò</th>
              <th className="px-4 py-3 text-left">Tình trạng</th>
              <th className="px-4 py-3 text-left">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={member.avatar}
                        alt={member.fullName}
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold uppercase">
                        {member.fullName.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {member.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{member.gender}</td>
                <td className="px-4 py-3">{member.phone}</td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">{member.address}</td>
                <td className="px-4 py-3">{member.jobTypeLabel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${member.statusClasses}`}
                  >
                    {member.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDetailOpen(member)}
                  >
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-gray-500"
                  colSpan={9}
                >
                  Không tìm thấy nhân viên nào có vai trò “nhân viên”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết nhân viên</DialogTitle>
            <DialogDescription>
              Xem thông tin liên hệ và lịch sử điểm danh trong 30 ngày gần nhất.
            </DialogDescription>
            {isLoadingStaffMeta && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="size-4 animate-spin text-gray-400" />
                Đang tải public metadata mới nhất...
              </div>
            )}
          </DialogHeader>

          {selectedStaff ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {selectedStaff.avatar ? (
                    <img
                      className="h-14 w-14 rounded-full object-cover"
                      src={selectedStaff.avatar}
                      alt={selectedStaff.fullName}
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold uppercase">
                      {selectedStaff.fullName?.slice(0, 1) ?? "?"}
                    </span>
                  )}
                  <div>
                    {isEditingStaff ? (
                      <div className="space-y-2">
                        <Input
                          value={staffForm.fullName}
                          onChange={(e) =>
                            handleStaffFormChange("fullName", e.target.value)
                          }
                          placeholder="Họ và tên"
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedStaff.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedStaff.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedStaff.phone}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedStaff.jobTypeLabel}
                  </Badge>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${selectedStaff.statusClasses}`}
                  >
                    {selectedStaff.statusLabel}
                  </span>
                  {!isEditingStaff && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingStaff(true)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </div>

              {isEditingStaff ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="staff-phone">Số điện thoại</Label>
                      <Input
                        id="staff-phone"
                        value={staffForm.phone}
                        onChange={(e) =>
                          handleStaffFormChange("phone", e.target.value)
                        }
                        placeholder="Số điện thoại"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-gender">Giới tính</Label>
                      <Select
                        value={staffForm.gender}
                        onValueChange={(value) =>
                          handleStaffFormChange("gender", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="staff-address">Địa chỉ</Label>
                      <Input
                        id="staff-address"
                        value={staffForm.address}
                        onChange={(e) =>
                          handleStaffFormChange("address", e.target.value)
                        }
                        placeholder="Địa chỉ"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveStaffInfo}
                      disabled={isSavingStaff}
                      className="bg-[#DF1D01] hover:bg-red-800"
                    >
                      {isSavingStaff ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingStaff(false);
                        // Reset form về giá trị ban đầu
                        setStaffForm({
                          fullName: selectedStaff.fullName || "",
                          phone: selectedStaff.phone || "",
                          address: selectedStaff.address || "",
                          gender: selectedStaff.gender || "",
                        });
                      }}
                      disabled={isSavingStaff}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-gray-500">Mã số nhân viên</p>
                    <p className="mt-1 text-sm font-medium truncate">
                      {selectedStaff.employeeCode || "Chưa có"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-gray-500">Địa chỉ</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedStaff.address || "Chưa có"}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Lịch sử điểm danh
                    </p>
                    <p className="text-xs text-gray-500">
                      {historyWindowLabel
                        ? `Khoảng: ${historyWindowLabel}`
                        : "30 ngày gần nhất"}
                    </p>
                  </div>

                  {historyLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="size-4 animate-spin text-gray-400" />
                      Đang tải dữ liệu...
                    </div>
                  )}
                </div>

                {historyError && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {historyError}
                  </p>
                )}

                {!historyError && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-gray-500">Ghi nhận</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {historySummary.total}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-gray-500">Đủ ca</p>
                        <p className="text-xl font-semibold text-green-600">
                          {historySummary.full}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-gray-500">1 ca</p>
                        <p className="text-xl font-semibold text-yellow-600">
                          {historySummary.partial}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-gray-500">Vắng</p>
                        <p className="text-xl font-semibold text-red-600">
                          {historySummary.absent}
                        </p>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      {historyRecords.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Ngày</th>
                              <th className="px-3 py-2 text-left">Ca sáng</th>
                              <th className="px-3 py-2 text-left">Ca chiều</th>
                              <th className="px-3 py-2 text-left">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyRecords.map((record) => {
                              const statusKey =
                                deriveAttendanceStatusKey(record);
                              const status =
                                ATTENDANCE_STATUS_LABELS[statusKey]?.text ??
                                "Chưa điểm danh";
                              return (
                                <tr key={`${record.date}`}>
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    {formatHistoryDate(record.date)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        record.morningShift
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {record.morningShift ? "Có mặt" : "Vắng"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        record.afternoonShift
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {record.afternoonShift
                                        ? "Có mặt"
                                        : "Vắng"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {status}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center text-sm text-gray-500">
                          Chưa có bản ghi điểm danh trong khoảng thời gian này.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-500">
              Chọn nhân viên để thấy chi tiết.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
