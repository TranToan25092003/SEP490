import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchBays, createBay, updateBay } from "@/api/bays";
import { toast } from "sonner";
import { Pencil, XCircle, CheckCircle } from "lucide-react";

export default function ManagerBays() {
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newBay, setNewBay] = useState({
    bay_number: "",
    status: "available",
    description: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBay, setEditingBay] = useState(null);
  const [editFormData, setEditFormData] = useState({
    bay_number: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await fetchBays({ page: 1, limit: 10, search, ...params });
      if (res.success) {
        setBays(res.data);
      }
    } catch {
      toast.error("Lỗi", { description: "Không tải được danh sách bay" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      toast.error("Tạo bay thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditDialog = (bay) => {
    setEditingBay(bay);
    setEditFormData({
      bay_number: bay.bay_number || "",
      description: bay.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editFormData.bay_number.trim()) {
      toast.error("Vui lòng nhập số bay");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await updateBay(editingBay._id, {
        bay_number: editFormData.bay_number,
        description: editFormData.description,
      });
      if (res.success) {
        toast.success("Đã cập nhật bay");
        setIsEditDialogOpen(false);
        setEditingBay(null);
        load();
      }
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivate = async (bay) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn vô hiệu hóa bay này? Bay sẽ không thể sử dụng cho các đơn hàng mới."
      )
    )
      return;
    try {
      const res = await updateBay(bay._id, {
        status: "inactive",
      });
      if (res.success) {
        toast.success("Đã vô hiệu hóa bay");
        load();
      }
    } catch {
      toast.error("Vô hiệu hóa thất bại");
    }
  };

  const handleActivate = async (bay) => {
    if (!confirm("Bạn có chắc chắn muốn kích hoạt lại bay này?")) return;
    try {
      const res = await updateBay(bay._id, {
        status: "available",
      });
      if (res.success) {
        toast.success("Đã kích hoạt bay");
        load();
      }
    } catch {
      toast.error("Kích hoạt thất bại");
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : bays.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Chưa có bay nào
                </TableCell>
              </TableRow>
            ) : (
              bays.map((bay) => (
                <TableRow key={bay._id}>
                  <TableCell className="font-medium">
                    {bay.bay_number}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bay.status === "available"
                          ? "text-green-600 bg-green-100"
                          : bay.status === "occupied"
                          ? "text-yellow-700 bg-yellow-100"
                          : "text-red-600 bg-red-100"
                      }`}
                    >
                      {bay.status === "available"
                        ? "Trống"
                        : bay.status === "occupied"
                        ? "Đang dùng"
                        : "Vô hiệu hóa"}
                    </span>
                  </TableCell>
                  <TableCell>{bay.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(bay)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      {bay.status === "inactive" ? (
                        <Button
                      variant="outline"
                      size="sm"
                          onClick={() => handleActivate(bay)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Kích hoạt
                        </Button>
                      ) : (
                    <Button
                          variant="outline"
                      size="sm"
                          onClick={() => handleDeactivate(bay)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                          <XCircle className="h-4 w-4 mr-1" />
                          Vô hiệu hóa
                    </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Bay</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin bay. Nhấn lưu để hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Số bay *</label>
              <Input
                placeholder="VD: Bay 1"
                value={editFormData.bay_number}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    bay_number: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                placeholder="Mô tả bay (tuỳ chọn)"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingBay(null);
              }}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={isUpdating}>
              {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
