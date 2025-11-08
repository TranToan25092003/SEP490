import React, { useEffect, useMemo, useState } from "react";
import { useOrganization, OrganizationProfile } from "@clerk/clerk-react";

const ROLE_LABELS = {
  mechanic: "Thợ",
  staff: "Nhân viên",
};

const STATUS_LABELS = {
  active: { text: "Đang làm", classes: "bg-green-100 text-green-700" },
  inactive: { text: "Đã nghỉ", classes: "bg-red-100 text-red-700" },
};

const StaffPage = () => {
  const { organization, isLoaded } = useOrganization();
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOrgManager, setShowOrgManager] = useState(false); // 🟢 nút bật/tắt

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
        const { data } = await organization.getMemberships({ limit: 100 });

        if (cancelled) return;

        const staffOnly = data.filter(
          (membership) =>
            membership.roleName === "staff" ||
            membership.publicMetadata?.role === "staff"
        );

        setMemberships(staffOnly);
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

  const rows = useMemo(
    () =>
      memberships.map((membership) => {
        const publicUserData = membership.publicUserData ?? {};
        const memberMetadata = {
          ...(publicUserData.publicMetadata ?? {}),
          ...(membership.publicMetadata ?? {}),
        };

        const fullName = [publicUserData.firstName, publicUserData.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        const jobType = memberMetadata.jobType ?? "staff";
        const status = memberMetadata.employmentStatus ?? "active";

        return {
          id: membership.id,
          employeeCode:
            memberMetadata.employeeCode ?? publicUserData.userId ?? "—",
          role: membership.roleName ?? memberMetadata.role ?? "staff",
          fullName: fullName || publicUserData.identifier || "Không rõ",
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
          statusLabel: STATUS_LABELS[status]?.text ?? "Đang làm",
          statusClasses:
            STATUS_LABELS[status]?.classes ?? "bg-green-100 text-green-700",
        };
      }),
    [memberships]
  );

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

      {/* 🟢 Nút bật/tắt trang quản lý tổ chức */}

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
              <th className="px-4 py-3 text-left">Mã nhân viên</th>
              <th className="px-4 py-3 text-left">Họ &amp; tên</th>
              <th className="px-4 py-3 text-left">Giới tính</th>
              <th className="px-4 py-3 text-left">Số điện thoại</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Địa chỉ</th>
              <th className="px-4 py-3 text-left">Vai trò</th>
              <th className="px-4 py-3 text-left">Tình trạng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {member.employeeCode}
                </td>
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
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-gray-500"
                  colSpan={8}
                >
                  Không tìm thấy nhân viên nào có vai trò “nhân viên”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffPage;
