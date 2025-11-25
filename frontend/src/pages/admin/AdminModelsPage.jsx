import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Search, Pen, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

const sortOptions = [
  { value: "brand,asc", label: "Thương hiệu (A-Z)" },
  { value: "brand,desc", label: "Thương hiệu (Z-A)" },
  { value: "name,asc", label: "Tên (A-Z)" },
  { value: "name,desc", label: "Tên (Z-A)" },
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "createdAt,asc", label: "Cũ nhất" },
];

// Dữ liệu rỗng cho việc tạo model
const defaultModelState = {
  name: "",
  brand: "",
  year: "",
  engine_type: "",
  description: "",
};

export default function AdminModelsPage() {
  const { models = [], pagination = {} } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedSort, setSelectedSort] = useState(
    `${searchParams.get("sortBy") || "brand"},${
      searchParams.get("sortOrder") || "asc"
    }`
  );

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get("search") || "")) {
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchTerm) {
          newSearchParams.set("search", searchTerm);
        } else {
          newSearchParams.delete("search");
        }
        newSearchParams.set("page", "1");
        setSearchParams(newSearchParams, { replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, setSearchParams]);

  const handleSortChange = (value) => {
    setSelectedSort(value);
    const [sortBy, sortOrder] = value.split(",");
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sortBy", sortBy);
    newSearchParams.set("sortOrder", sortOrder);
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleOpenAddModal = () => {
    setSelectedModel(defaultModelState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleModelFormChange = (e) => {
    const { name, value } = e.target;
    setSelectedModel((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async () => {
    if (!selectedModel) return;

    // Validation
    const { name, brand } = selectedModel;
    if (!name || name.trim() === "") {
      toast.error("Lỗi Validation", {
        description: "Tên mẫu xe không được để trống.",
      });
      return;
    }
    if (!brand || brand.trim() === "") {
      toast.error("Lỗi Validation", {
        description: "Tên thương hiệu không được để trống.",
      });
      return;
    }

    const isEditMode = !!selectedModel._id;
    const url = isEditMode
      ? `/admin/models/${selectedModel._id}` // API endpoint cho model
      : "/admin/models"; // API endpoint cho model
    const method = isEditMode ? "PATCH" : "POST";

    setIsSubmitting(true);
    try {
      const response = await customFetch(url, {
        method: method,
        data: selectedModel,
      });

      if (response.data.success) {
        toast.success(
          isEditMode
            ? "Cập nhật mẫu xe thành công."
            : "Tạo mẫu xe mới thành công."
        );
        setIsModalOpen(false);
        setSelectedModel(null);
        navigate(0); // Tải lại trang
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(isEditMode ? "Lỗi khi cập nhật" : "Lỗi khi tạo mới", {
        description:
          error.message ||
          `Không thể ${isEditMode ? "cập nhật" : "tạo"} mẫu xe.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateModel = async (model) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn vô hiệu hóa mẫu xe này? Mẫu xe sẽ không thể sử dụng cho các đơn hàng mới."
      )
    )
      return;
    setIsDeactivating(true);
    try {
      const response = await customFetch(`/admin/models/${model._id}`, {
        method: "PATCH",
        data: { status: "inactive" },
      });
      if (response.data.success) {
        toast.success("Đã vô hiệu hóa mẫu xe");
        navigate(0);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi vô hiệu hóa mẫu xe", {
        description: error.message || "Không thể vô hiệu hóa mẫu xe.",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateModel = async (model) => {
    if (!window.confirm("Bạn có chắc chắn muốn kích hoạt lại mẫu xe này?"))
      return;
    setIsDeactivating(true);
    try {
      const response = await customFetch(`/admin/models/${model._id}`, {
        method: "PATCH",
        data: { status: "active" },
      });
      if (response.data.success) {
        toast.success("Đã kích hoạt mẫu xe");
        navigate(0);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi kích hoạt mẫu xe", {
        description: error.message || "Không thể kích hoạt mẫu xe.",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-[520px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, thương hiệu..."
            className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto">
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-full">
              <SelectValue placeholder="Sắp xếp theo..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleOpenAddModal}>+ Thêm mẫu xe</Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên mẫu xe</TableHead>
              <TableHead>Thương hiệu</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Năm</TableHead>
              <TableHead>Loại động cơ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  Không có mẫu xe nào
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model._id}>
                  <TableCell>
                    <div className="font-medium text-[#2e2e3a]">
                      {model.name}
                    </div>
                    <div className="text-sm text-[#9a9aaf]">
                      #{model._id.slice(-6).toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>{model.brand}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {model.description || "N/A"}
                  </TableCell>
                  <TableCell>{model.year || "N/A"}</TableCell>
                  <TableCell>{model.engine_type || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (model.status || "active") === "active"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                      }`}
                    >
                      {(model.status || "active") === "active"
                        ? "Hoạt động"
                        : "Vô hiệu hóa"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(model.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(model)}
                      >
                        <Pen className="h-4 w-4 text-blue-500" />
                      </Button>
                      {(model.status || "active") === "inactive" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivateModel(model)}
                          disabled={isDeactivating}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {isDeactivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivateModel(model)}
                          disabled={isDeactivating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isDeactivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
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

      {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}

      {/* Modal cho Thêm/Sửa Mẫu xe */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedModel?._id ? "Chỉnh sửa Mẫu xe" : "Tạo Mẫu xe Mới"}
            </DialogTitle>
            <DialogDescription>
              {selectedModel?._id
                ? "Cập nhật thông tin chi tiết cho mẫu xe."
                : "Điền thông tin chi tiết cho mẫu xe mới."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit();
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên mẫu xe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={selectedModel?.name || ""}
                onChange={handleModelFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brand" className="text-right">
                Thương hiệu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand"
                name="brand"
                value={selectedModel?.brand || ""}
                onChange={handleModelFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Năm
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={selectedModel?.year || ""}
                onChange={handleModelFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="engine_type" className="text-right">
                Loại động cơ
              </Label>
              <Input
                id="engine_type"
                name="engine_type"
                value={selectedModel?.engine_type || ""}
                onChange={handleModelFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Mô tả
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Mô tả chi tiết mẫu xe..."
                value={selectedModel?.description || ""}
                onChange={handleModelFormChange}
                className="col-span-3 min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedModel(null)}
                >
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedModel?._id ? "Lưu thay đổi" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
