import { useLoaderData, useSearchParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPagination } from "@/components/global/AdminPagination";
import dayjs from "dayjs";

export default function ActivityLogs() {
  const { logs = [], pagination } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filterValue = searchParams.get("action") || "";

  const handleFilterChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("action", value);
    else params.delete("action");
    params.delete("page");
    setSearchParams(params);
  };

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        id: log._id,
        time: dayjs(log.createdAt).format("DD/MM/YYYY HH:mm"),
        actor: log.actorName || log.actorEmail || log.actorClerkId,
        action: log.action,
        description: log.description || "—",
      })),
    [logs]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Nhật ký hoạt động</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi các hành động quan trọng của người dùng trong hệ thống.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(0)}>
          Làm mới
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Lọc theo action (e.g., user.login, booking.create)"
          value={filterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Người thực hiện</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Mô tả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Chưa có hoạt động nào.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{row.time}</td>
                  <td className="px-4 py-3">{row.actor}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3">{row.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination pagination={pagination} />
    </div>
  );
}
