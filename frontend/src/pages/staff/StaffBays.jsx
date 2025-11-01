import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchBays, createBay, updateBay, deleteBay } from "@/api/bays";
import { toast } from "sonner";

export default function StaffBays() {
  const [bays, setBays] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newBay, setNewBay] = useState({
    bay_number: "",
    status: "available",
    description: "",
  });

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await fetchBays({ page: 1, limit: 10, search, ...params });
      if (res.success) {
        setBays(res.data);
        setPagination(res.pagination);
      }
    } catch (e) {
      toast.error("Lỗi", { description: "Không tải được danh sách bay" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newBay.bay_number.trim()) return toast.error("Vui lòng nhập số bay");
    setCreating(true);
    try {
      const res = await createBay(newBay);
      if (res.success) {
        toast.success("Đã tạo bay");
        setNewBay({ bay_number: "", status: "available", description: "" });
        load();
      }
    } catch (e) {
      toast.error("Tạo bay thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (bay) => {
    try {
      const res = await updateBay(bay._id, {
        status: bay.status === "available" ? "occupied" : "available",
      });
      if (res.success) {
        toast.success("Cập nhật trạng thái");
        load();
      }
    } catch (e) {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleDelete = async (bay) => {
    try {
      const res = await deleteBay(bay._id);
      if (res.success) {
        toast.success("Đã xóa bay");
        load();
      }
    } catch (e) {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý Bay</h1>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Tìm theo số bay hoặc mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => load({ page: 1 })}>Tìm</Button>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Input
            placeholder="Số bay (VD: Bay 1)"
            value={newBay.bay_number}
            onChange={(e) =>
              setNewBay((s) => ({ ...s, bay_number: e.target.value }))
            }
          />
          <Input
            placeholder="Mô tả (tuỳ chọn)"
            value={newBay.description}
            onChange={(e) =>
              setNewBay((s) => ({ ...s, description: e.target.value }))
            }
          />
          <Button onClick={handleCreate} disabled={creating}>
            Thêm bay
          </Button>
        </div>
      </div>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số bay</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bays.map((bay) => (
              <TableRow key={bay._id}>
                <TableCell className="font-medium">{bay.bay_number}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bay.status === "available"
                        ? "text-green-600 bg-green-100"
                        : "text-yellow-700 bg-yellow-100"
                    }`}
                  >
                    {bay.status === "available" ? "Trống" : "Đang dùng"}
                  </span>
                </TableCell>
                <TableCell>{bay.description || "-"}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(bay)}
                  >
                    Đổi trạng thái
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(bay)}
                  >
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
