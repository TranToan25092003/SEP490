import { useState } from "react";
import { useLoaderData, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, XCircle, AlertCircle } from "lucide-react";
import { searchIcon as searchSvg } from "@/assets/admin/topmenu_new";
import {
  Table,
  TableBody,
  TableCell,
  TableCellMinContent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import imgBg from "@/assets/admin/figma_selection/faeefebc0dff5a2e07fafd82684d5fe511a5f7d1.png";
import statusTick from "@/assets/admin/figma_selection/ce384d644dd0363c728f1fb1d4d8b014fb7f30c8.svg";
import iconEdit from "@/assets/admin/figma_selection/30d22df015a0acce3dd7984d089bd037853622d7.svg";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Link } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

export default function ManagerItems() {
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedItems, setSelectedItems] = useState([]);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sellingPrice: "",
    costPrice: "",
    description: "",
    brand: "",
    quantity: "",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { parts = [], pagination = {} } = loaderData || {};

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set("search", value);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.delete("page"); // Reset to first page
    setSearchParams(newSearchParams);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(parts.map((part) => part._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle select item
  const handleSelectItem = (partId, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, partId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== partId));
    }
  };

  // Get display status based on part status and quantity
  const getDisplayStatus = (part) => {
    const status = part.status || "active";
    const quantity = part.quantity || 0;

    // If quantity is 0, show "Hết hàng" (discontinued)
    if (quantity === 0) {
      return {
        text: "Hết hàng",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        status: "discontinued",
      };
    }

    // Otherwise show based on status
    switch (status) {
      case "active":
        return {
          text: "Có sẵn",
          color: "text-[#24ca49]",
          bgColor: "bg-green-100",
          status: "active",
        };
      case "inactive":
        return {
          text: "Vô hiệu hóa",
          color: "text-red-600",
          bgColor: "bg-red-100",
          status: "inactive",
        };
      case "discontinued":
        return {
          text: "Hết hàng",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
          status: "discontinued",
        };
      default:
        return {
          text: "Có sẵn",
          color: "text-[#24ca49]",
          bgColor: "bg-green-100",
          status: "active",
        };
    }
  };

  // Handle deactivate single item (toggle between active and inactive)
  const handleDeactivateItem = async (part) => {
    const currentStatus = part.status || "active";
    // Only toggle between active and inactive, not discontinued
    if (currentStatus === "discontinued") {
      toast.error("Lỗi", {
        description: "Không thể thay đổi trạng thái của sản phẩm đã hết hàng",
      });
      return;
    }

    const action = currentStatus === "active" ? "vô hiệu hóa" : "kích hoạt";
    if (!confirm(`Bạn có chắc chắn muốn ${action} sản phẩm này?`)) return;

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await customFetch(`/manager/parts/${part._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          status: newStatus,
          // Include other required fields to avoid validation errors
          name: part.name,
          sellingPrice: part.sellingPrice,
          costPrice: part.costPrice || part.sellingPrice,
          quantity: part.quantity || 0,
        },
      });

      if (response.data.success) {
        toast.success("Thành công", {
          description: `Sản phẩm đã được ${action}`,
        });
        // Refresh the page
        window.location.reload();
      } else {
        throw new Error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Không thể ${action} sản phẩm`;
      toast.error("Lỗi", {
        description: errorMessage,
      });
      console.error("Deactivate error:", error.response?.data || error);
    }
  };

  // Handle open edit dialog
  const handleOpenEditDialog = (part) => {
    setEditingPart(part);
    const quantity = part.quantity || 0;
    // If quantity is 0, set status to discontinued
    const initialStatus =
      quantity === 0 ? "discontinued" : part.status || "active";
    setEditFormData({
      name: part.name || "",
      sellingPrice: part.sellingPrice || "",
      costPrice: part.costPrice || "",
      description: part.description || "",
      brand: part.brand || "",
      quantity: quantity,
      status: initialStatus,
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !editingPart) return;

    setIsSubmitting(true);
    try {
      const quantity = parseInt(editFormData.quantity) || 0;
      // If quantity is 0, automatically set status to discontinued
      const finalStatus = quantity === 0 ? "discontinued" : editFormData.status;

      const submitData = {
        ...editFormData,
        sellingPrice: parseFloat(editFormData.sellingPrice) || 0,
        costPrice: parseFloat(editFormData.costPrice) || 0,
        quantity: quantity,
        status: finalStatus,
      };

      const response = await customFetch(`/manager/parts/${editingPart._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        data: submitData,
      });

      if (response.data.success) {
        toast.success("Thành công", {
          description: "Sản phẩm đã được cập nhật",
        });
        setIsEditDialogOpen(false);
        setEditingPart(null);
        // Refresh the page
        window.location.reload();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể cập nhật sản phẩm",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk toggle status
  const handleBulkToggleStatus = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thay đổi trạng thái");
      return;
    }

    // Get selected parts and determine action
    const selectedParts = parts.filter((part) =>
      selectedItems.includes(part._id)
    );

    // Filter out discontinued parts
    const validParts = selectedParts.filter(
      (part) =>
        (part.status || "active") !== "discontinued" && (part.quantity || 0) > 0
    );

    if (validParts.length === 0) {
      toast.error("Lỗi", {
        description: "Không thể thay đổi trạng thái của sản phẩm đã hết hàng",
      });
      return;
    }

    // Determine if we should activate or deactivate based on majority
    const activeCount = validParts.filter(
      (part) => (part.status || "active") === "active"
    ).length;
    const willActivate = activeCount < validParts.length / 2;
    const action = willActivate ? "kích hoạt" : "vô hiệu hóa";

    if (
      !confirm(
        `Bạn có chắc chắn muốn ${action} ${validParts.length} sản phẩm đã chọn?`
      )
    )
      return;

    setIsTogglingStatus(true);
    try {
      const newStatus = willActivate ? "active" : "inactive";
      const updatePromises = validParts.map((part) =>
        customFetch(`/manager/parts/${part._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          data: {
            status: newStatus,
            name: part.name,
            sellingPrice: part.sellingPrice,
            costPrice: part.costPrice || part.sellingPrice,
            quantity: part.quantity || 0,
          },
        })
      );

      await Promise.all(updatePromises);

      toast.success("Thành công", {
        description: `${validParts.length} sản phẩm đã được ${action}`,
      });
      setSelectedItems([]);
      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể thay đổi trạng thái sản phẩm",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Thêm phụ tùng</h1>
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-[520px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px]">
            <img
              src={searchSvg}
              alt="search"
              className="block w-[18px] h-[18px]"
            />
          </span>
          <Input
            placeholder="Tìm kiếm..."
            className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/manager/items/add">+ Thêm sản phẩm</Link>
          </Button>
          <Button asChild>
            <Link to="/manager/goods-receipt">+ Tạo phiếu nhập kho</Link>
          </Button>
          {/* <Button asChild variant="outline">
            <Link to="/manager/goods-receipt-list">Danh sách phiếu nhập</Link>
          </Button> */}
          {selectedItems.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkToggleStatus}
              disabled={isTogglingStatus}
            >
              {isTogglingStatus
                ? "Đang xử lý..."
                : `Thay đổi trạng thái (${selectedItems.length})`}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                aria-label="Select all"
                checked={
                  selectedItems.length === parts.length && parts.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Tên sản phẩm/ Mã sản phẩm</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Thương hiệu</TableHead>
            <TableHead>Số lượng tồn kho</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Giá Bán</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Không có sản phẩm nào
              </TableCell>
            </TableRow>
          ) : (
            parts.map((part) => (
              <TableRow key={part._id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select row ${part._id}`}
                    checked={selectedItems.includes(part._id)}
                    onCheckedChange={(checked) =>
                      handleSelectItem(part._id, checked)
                    }
                  />
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-9 h-9 shrink-0">
                      {part.media && part.media.length > 0 ? (
                        <img
                          src={part.media[0].url}
                          alt={part.name}
                          className="absolute left-[2px] top-[2px] w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <img
                          src={imgBg}
                          alt="default"
                          className="absolute left-[2px] top-[2px] w-8 h-8"
                        />
                      )}
                    </div>
                    <div className="leading-4 min-w-0 flex-1 overflow-hidden">
                      <div
                        className="text-[#2e2e3a] text-[14px] font-bold tracking-[-0.126px] truncate"
                        title={part.name}
                      >
                        {part.name}
                      </div>
                      <div className="text-[#9a9aaf] text-[12px]">
                        #{part._id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(part.createdAt)}</TableCell>
                <TableCell>{part.brand || "Chưa phân loại"}</TableCell>
                <TableCell>{part.quantity} cái</TableCell>
                <TableCell>
                  {(() => {
                    const displayStatus = getDisplayStatus(part);
                    // Choose icon based on status
                    let iconElement;
                    if (displayStatus.status === "active") {
                      iconElement = (
                        <img
                          src={statusTick}
                          alt={displayStatus.status}
                          className="w-[18px] h-[18px]"
                        />
                      );
                    } else if (displayStatus.status === "inactive") {
                      iconElement = (
                        <XCircle className="w-[18px] h-[18px] text-red-600" />
                      );
                    } else {
                      // discontinued
                      iconElement = (
                        <AlertCircle className="w-[18px] h-[18px] text-amber-600" />
                      );
                    }

                    return (
                      <div className="flex items-center gap-1">
                        {iconElement}
                        <span className={`text-[12px] ${displayStatus.color}`}>
                          {displayStatus.text}
                        </span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>{formatPrice(part.sellingPrice)}</TableCell>
                <TableCellMinContent>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center transition-all duration-200 hover:bg-blue-50 hover:shadow-md hover:scale-105"
                      onClick={() => handleOpenEditDialog(part)}
                    >
                      <img
                        src={iconEdit}
                        alt="edit"
                        className="w-[14px] h-[14px] transition-opacity duration-200 hover:opacity-80"
                      />
                    </button>
                    <button
                      className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center transition-all duration-200 hover:bg-red-50 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDeactivateItem(part)}
                      disabled={
                        (part.status || "active") === "discontinued" ||
                        (part.quantity || 0) === 0
                      }
                      title={
                        (part.status || "active") === "active"
                          ? "Vô hiệu hóa"
                          : (part.status || "active") === "inactive"
                          ? "Kích hoạt"
                          : "Không thể thay đổi trạng thái"
                      }
                    >
                      <Eye className="w-[14px] h-[14px] text-gray-600 transition-opacity duration-200 hover:opacity-80" />
                    </button>
                  </div>
                </TableCellMinContent>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phụ tùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin phụ tùng. Nhấn lưu để hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tên sản phẩm *</label>
                <Input
                  placeholder="Nhập tên sản phẩm"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Thương hiệu</label>
                  <Input
                    placeholder="VD: Honda, Yamaha"
                    value={editFormData.brand}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        brand: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Số lượng tồn kho *
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 100"
                    value={editFormData.quantity}
                    onChange={(e) => {
                      const newQuantity = e.target.value;
                      const quantityNum = parseInt(newQuantity) || 0;
                      setEditFormData({
                        ...editFormData,
                        quantity: newQuantity,
                        // Auto-update status to discontinued if quantity becomes 0
                        status:
                          quantityNum === 0
                            ? "discontinued"
                            : editFormData.status,
                      });
                    }}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá bán *</label>
                  <Input
                    type="number"
                    placeholder="VD: 120000"
                    value={editFormData.sellingPrice}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        sellingPrice: e.target.value,
                      })
                    }
                    required
                    min="0"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá nhập *</label>
                  <Input
                    type="number"
                    placeholder="VD: 100000"
                    value={editFormData.costPrice}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        costPrice: e.target.value,
                      })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Trạng thái *</label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Có sẵn (Active)</SelectItem>
                    <SelectItem value="inactive">
                      Đang bị vô hiệu hóa (Inactive)
                    </SelectItem>
                    <SelectItem value="discontinued">
                      Hết hàng (Discontinued)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {editFormData.quantity > 0 &&
                  editFormData.status === "discontinued" && (
                    <p className="text-xs text-amber-600">
                      Lưu ý: Số lượng còn {editFormData.quantity}, trạng thái
                      "Hết hàng" thường dùng khi số lượng = 0
                    </p>
                  )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  placeholder="Mô tả sản phẩm"
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
