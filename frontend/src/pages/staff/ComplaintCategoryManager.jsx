import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getStaffComplaintCategories,
  createComplaintCategory,
  updateComplaintCategory,
  deleteComplaintCategory,
} from "@/api/complaintCategories";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";

const initialFormState = {
  name: "",
  description: "",
  isActive: true,
};

export default function ComplaintCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getStaffComplaintCategories({ includeInactive: true });
      setCategories(data);
    } catch (error) {
      console.error("Failed to load complaint categories", error);
      toast.error("Không thể tải danh mục khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!formState.name.trim()) {
      toast.error("Tên danh mục không được để trống");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateComplaintCategory(editingCategory._id, {
          name: formState.name,
          description: formState.description,
          isActive: formState.isActive,
        });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createComplaintCategory({
          name: formState.name,
          description: formState.description,
        });
        toast.success("Thêm danh mục thành công");
      }
      setDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error("Failed to save category", error);
      toast.error(
        error.response?.data?.message || "Không thể lưu danh mục khiếu nại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa danh mục này? Các khiếu nại đang sử dụng sẽ không bị xóa."
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteComplaintCategory(categoryId);
      toast.success("Xóa danh mục thành công");
      loadCategories();
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error(
        error.response?.data?.message || "Không thể xóa danh mục khiếu nại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await updateComplaintCategory(category._id, {
        isActive: !category.isActive,
      });
      loadCategories();
    } catch (error) {
      console.error("Failed to toggle category", error);
      toast.error("Không thể cập nhật trạng thái danh mục");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-3xl font-bold">
              Quản lý danh mục khiếu nại
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm mới, chỉnh sửa hoặc vô hiệu hóa danh mục khiếu nại để khách
              hàng lựa chọn chính xác hơn.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm danh mục
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải danh mục...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Chưa có danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[200px]" title={category.name}>
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="truncate" title={category.description || "-"}>
                          {category.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              category.isActive ? "success" : "secondary"
                            }
                          >
                            {category.isActive ? "Đang dùng" : "Đã ẩn"}
                          </Badge>
                          <Switch
                            checked={category.isActive}
                            onCheckedChange={() => handleToggleActive(category)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {category.updatedAt
                          ? new Date(category.updatedAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteCategory(category._id)}
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Tên danh mục</Label>
              <Input
                id="category-name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ví dụ: Thái độ nhân viên"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Mô tả</Label>
              <Textarea
                id="category-description"
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Ghi chú để nhân viên hiểu rõ khi xử lý"
                rows={3}
              />
            </div>
            {editingCategory && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Hiển thị cho khách hàng</p>
                  <p className="text-xs text-muted-foreground">
                    Tắt nếu bạn muốn tạm ẩn danh mục này khỏi danh sách.
                  </p>
                </div>
                <Switch
                  checked={formState.isActive}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              type="button"
            >
              Hủy
            </Button>
            <Button onClick={handleSaveCategory} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
