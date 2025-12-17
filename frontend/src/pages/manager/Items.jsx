import { useState, useEffect } from "react";
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
import { uploadPartImage, validateFile } from "@/utils/uploadCloudinary";
import { X, ChevronsUpDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ModelCompatibilityTree = ({
  groupedModels,
  selectedIds,
  onSelectionChange,
}) => {
  const [filter, setFilter] = useState("");

  const handleModelSelect = (modelId, isSelected) => {
    const newIds = new Set(selectedIds.map((id) => String(id))); // Ensure all are strings
    const modelIdStr = String(modelId);
    if (isSelected) {
      newIds.delete(modelIdStr);
    } else {
      newIds.add(modelIdStr);
    }
    onSelectionChange(Array.from(newIds));
  };

  const handleBrandSelectAll = (brandModels, isAllSelected) => {
    const modelIdsInBrand = brandModels.map((m) => String(m._id));
    const newIds = new Set(selectedIds.map((id) => String(id))); // Ensure all are strings

    if (isAllSelected) {
      modelIdsInBrand.forEach((id) => newIds.delete(id));
    } else {
      modelIdsInBrand.forEach((id) => newIds.add(id));
    }
    onSelectionChange(Array.from(newIds));
  };

  const filteredGroups = groupedModels
    .map((group) => ({
      ...group,
      models: group.models.filter((model) =>
        model.name.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter(
      (group) =>
        group.brand.toLowerCase().includes(filter.toLowerCase()) ||
        group.models.length > 0
    );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm hãng hoặc dòng xe..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-9"
      />
      <div className="max-h-200 overflow-y-auto space-y-2 rounded-md border p-2">
        {filteredGroups.length === 0 && (
          <p className="text-center text-sm text-gray-500">Không tìm thấy.</p>
        )}

        {filteredGroups.map((group) => {
          const modelsInBrandIds = group.models.map((m) => String(m._id));
          const selectedInBrandCount = modelsInBrandIds.filter((id) =>
            selectedIds.some((selectedId) => String(selectedId) === id)
          ).length;
          const isAllSelected =
            selectedInBrandCount === modelsInBrandIds.length &&
            modelsInBrandIds.length > 0;
          const isIndeterminate =
            selectedInBrandCount > 0 &&
            selectedInBrandCount < modelsInBrandIds.length;

          return (
            <details key={group.brand} open>
              <summary className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`brand-${group.brand}`}
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() =>
                      handleBrandSelectAll(group.models, isAllSelected)
                    }
                  />
                  <label
                    htmlFor={`brand-${group.brand}`}
                    className="flex-1 cursor-pointer text-sm font-semibold"
                    onClick={(e) => e.preventDefault()}
                  >
                    {group.brand} ({selectedInBrandCount}/
                    {modelsInBrandIds.length})
                  </label>
                </div>
                <div className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                </div>
              </summary>
              <div className="py-2 pl-6">
                {group.models.map((model) => {
                  const modelIdStr = String(model._id);
                  const isSelected = selectedIds.some(
                    (id) => String(id) === modelIdStr
                  );
                  return (
                    <div
                      key={model._id}
                      className="flex items-center gap-2 py-1"
                    >
                      <Checkbox
                        id={model._id}
                        checked={isSelected}
                        onCheckedChange={() =>
                          handleModelSelect(model._id, isSelected)
                        }
                      />
                      <label
                        htmlFor={model._id}
                        className="text-sm cursor-pointer"
                      >
                        {model.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

export default function ManagerItems() {
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("statusFilter") || "all"
  );
  const [selectedItems, setSelectedItems] = useState([]);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailPart, setDetailPart] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sellingPrice: "",
    costPrice: "",
    description: "",
    brand: "",
    status: "active",
    compatible_model_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImagePreviews, setNewImagePreviews] = useState([]); // [{ file, url, id }]
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [groupedModels, setGroupedModels] = useState([]);
  const [toggleConfirm, setToggleConfirm] = useState({ open: false, part: null, action: null });
  const [bulkToggleConfirm, setBulkToggleConfirm] = useState({ open: false, action: null, count: 0 });

  const { parts = [], pagination = {} } = loaderData || {};

  // Load grouped models on mount
  useEffect(() => {
    const loadGroupedModels = async () => {
      try {
        const response = await customFetch("/models/grouped-by-brand");
        if (response.data.success) {
          setGroupedModels(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load grouped models:", error);
      }
    };
    loadGroupedModels();
  }, []);

  // Cleanup image preview URLs when dialog closes
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [newImagePreviews]);

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

  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    const newSearchParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newSearchParams.set("statusFilter", value);
    } else {
      newSearchParams.delete("statusFilter");
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
  const handleDeactivateItem = (part) => {
    const currentStatus = part.status || "active";
    // Only toggle between active and inactive, not discontinued
    if (currentStatus === "discontinued") {
      toast.error("Lỗi", {
        description: "Không thể thay đổi trạng thái của sản phẩm đã hết hàng",
      });
      return;
    }

    const action = currentStatus === "active" ? "vô hiệu hóa" : "kích hoạt";
    setToggleConfirm({ open: true, part, action });
  };

  const confirmToggleItem = async () => {
    if (!toggleConfirm.part) return;
    const part = toggleConfirm.part;
    const currentStatus = part.status || "active";

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
    // If status is discontinued but quantity > 0, reset to active (discontinued can't be selected manually)
    let initialStatus;
    if (part.status === "discontinued" && (part.quantity || 0) > 0) {
      initialStatus = "active"; // Reset to active if discontinued but has quantity
    } else {
      initialStatus = part.status || "active";
    }

    // Extract compatible_model_ids - handle both array of IDs and array of objects
    // Remove duplicates and ensure all are strings
    const compatibleModelIds = part.compatible_model_ids
      ? Array.from(
          new Set(
            part.compatible_model_ids
              .map((item) =>
                typeof item === "object" && item._id
                  ? String(item._id)
                  : String(item)
              )
              .filter((id) => id && id !== "undefined" && id !== "null")
          )
        )
      : [];

    setEditFormData({
      name: part.name || "",
      sellingPrice: part.sellingPrice || "",
      costPrice: part.costPrice || "",
      description: part.description || "",
      brand: part.brand || "",
      status: initialStatus,
      compatible_model_ids: compatibleModelIds,
    });
    setNewImagePreviews([]); // Reset image previews when opening dialog
    setIsEditDialogOpen(true);
  };

  const handleOpenDetailDialog = (part) => {
    setDetailPart(part);
    setIsDetailDialogOpen(true);
  };

  // Handle image file selection (multiple files)
  const handleImageSelect = (files) => {
    if (!files || files.length === 0) return;

    const validPreviews = [];
    const errors = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });

      if (validation.isValid) {
        validPreviews.push({
          id: Date.now() + Math.random(), // Unique ID
          file,
          url: URL.createObjectURL(file),
        });
      } else {
        errors.push(`${file.name}: ${validation.errors.join(", ")}`);
      }
    });

    if (errors.length > 0) {
      toast.error("Lỗi file", {
        description: errors.join("; "),
      });
    }

    if (validPreviews.length > 0) {
      setNewImagePreviews((prev) => [...prev, ...validPreviews]);
    }
  };

  // Handle remove specific image preview
  const handleRemoveImagePreview = (previewId) => {
    setNewImagePreviews((prev) => {
      const previewToRemove = prev.find((p) => p.id === previewId);
      if (previewToRemove?.url) {
        URL.revokeObjectURL(previewToRemove.url);
      }
      return prev.filter((p) => p.id !== previewId);
    });
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !editingPart) return;

    setIsSubmitting(true);
    try {
      // Keep existing quantity, don't allow editing
      const quantity = editingPart.quantity || 0;
      // If quantity is 0, automatically set status to discontinued
      const finalStatus = quantity === 0 ? "discontinued" : editFormData.status;

      // Handle media: only upload new images, keep existing media IDs
      let media = [];

      // Keep existing media IDs (from editingPart.media)
      if (editingPart.media && Array.isArray(editingPart.media)) {
        // Extract IDs from existing media (could be ObjectIds or objects with _id)
        media = editingPart.media.map((item) => {
          if (typeof item === "string") return item;
          if (item._id) return item._id;
          if (item.id) return item.id;
          return item;
        });
      }

      // Upload new images if selected
      if (newImagePreviews.length > 0) {
        setIsUploadingImage(true);
        try {
          const uploadedMedia = [];
          for (const preview of newImagePreviews) {
            try {
              const uploadResult = await uploadPartImage(preview.file);
              uploadedMedia.push({
                publicId: uploadResult.publicId,
                url: uploadResult.url,
                kind: uploadResult.kind,
              });
            } catch (error) {
              console.error("Upload error:", error);
              toast.error("Lỗi upload ảnh", {
                description: `Không thể upload ${preview.file.name}`,
              });
              setIsUploadingImage(false);
              setIsSubmitting(false);
              return;
            }
          }
          // Add new media to existing media (don't replace, append)
          // If user wants to replace, they should remove old images first
          media = [...media, ...uploadedMedia];
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Lỗi upload ảnh", {
            description: "Không thể upload ảnh mới",
          });
          setIsUploadingImage(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Remove duplicates from compatible_model_ids and ensure they are strings
      const uniqueCompatibleModelIds = Array.from(
        new Set(
          (editFormData.compatible_model_ids || []).map((id) =>
            String(id).trim()
          )
        )
      ).filter((id) => id); // Remove empty strings

      const submitData = {
        name: editFormData.name,
        code: editingPart.code, // Keep existing code to avoid unique constraint error
        sellingPrice: parseFloat(editFormData.sellingPrice) || 0,
        costPrice: parseFloat(editFormData.costPrice) || 0,
        quantity: quantity,
        status: finalStatus,
        description: editFormData.description || "",
        brand: editFormData.brand || "",
        compatible_model_ids: uniqueCompatibleModelIds,
        media: media, // Include media array
      };

      // Debug log
      console.log("Submitting part update:", {
        id: editingPart._id,
        submitData,
        compatible_model_ids: submitData.compatible_model_ids,
      });

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
        setNewImagePreviews([]);
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

    setBulkToggleConfirm({ open: true, action, count: validParts.length });
  };

  const confirmBulkToggle = async () => {
    const selectedParts = parts.filter((part) =>
      selectedItems.includes(part._id)
    );

    const validParts = selectedParts.filter(
      (part) =>
        (part.status || "active") !== "discontinued" && (part.quantity || 0) > 0
    );

    const activeCount = validParts.filter(
      (part) => (part.status || "active") === "active"
    ).length;
    const willActivate = activeCount < validParts.length / 2;
    const newStatus = willActivate ? "active" : "inactive";

    setIsTogglingStatus(true);
    try {
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
        description: `${validParts.length} sản phẩm đã được ${bulkToggleConfirm.action}`,
      });
      setSelectedItems([]);
      setBulkToggleConfirm({ open: false, action: null, count: 0 });
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
      <h1 className="text-2xl font-semibold">Quản Lý Phụ Tùng</h1>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
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
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[200px] h-10">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="available">Có sẵn</SelectItem>
              <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              <SelectItem value="inactive">Bị vô hiệu hóa</SelectItem>
            </SelectContent>
          </Select>
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
                      <button
                        type="button"
                        className="text-left text-[#2e2e3a] text-[14px] font-bold tracking-[-0.126px] truncate hover:text-red-600"
                        title={part.name}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetailDialog(part);
                        }}
                      >
                        {part.name}
                      </button>
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
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Cleanup when dialog closes
            newImagePreviews.forEach((preview) => {
              if (preview?.url) {
                URL.revokeObjectURL(preview.url);
              }
            });
            setNewImagePreviews([]);
          }
          setIsEditDialogOpen(open);
        }}
      >
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
                <label className="text-sm font-medium">Số lượng tồn kho</label>
                  <Input
                  value={`${editingPart?.quantity || 0} cái`}
                  readOnly
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Số lượng tồn kho chỉ có thể thay đổi thông qua phiếu nhập kho
                </p>
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
                  </SelectContent>
                </Select>
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
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Dòng xe tương thích
                </label>
                <ModelCompatibilityTree
                  groupedModels={groupedModels}
                  selectedIds={editFormData.compatible_model_ids}
                  onSelectionChange={(newIds) =>
                    setEditFormData({
                      ...editFormData,
                      compatible_model_ids: newIds,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Hình ảnh</label>
                <div className="space-y-3">
                  {/* Current image */}
                  {editingPart?.media && editingPart.media.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Ảnh hiện tại:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {editingPart.media.map((mediaItem, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={mediaItem.url}
                              alt={`Current ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-md border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* New image previews */}
                  {newImagePreviews.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Ảnh mới ({newImagePreviews.length}):
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {newImagePreviews.map((preview) => (
                          <div key={preview.id} className="relative">
                            <img
                              src={preview.url}
                              alt="New preview"
                              className="w-24 h-24 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveImagePreview(preview.id)
                              }
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                              aria-label="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Upload button */}
                  <div>
                    <label className="cursor-pointer">
                      <div
                        className="h-[120px] rounded-[8px] border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add(
                            "border-blue-400",
                            "bg-blue-50"
                          );
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove(
                            "border-blue-400",
                            "bg-blue-50"
                          );
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove(
                            "border-blue-400",
                            "bg-blue-50"
                          );
                          const files = e.dataTransfer?.files;
                          if (files && files.length > 0) {
                            handleImageSelect(files);
                          }
                        }}
                      >
                        {isUploadingImage ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p className="text-xs">Đang upload...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm">
                              {newImagePreviews.length > 0
                                ? `Đã chọn ${newImagePreviews.length} ảnh - Chọn thêm`
                                : "Chọn ảnh mới để thay thế"}
                            </p>
                            <p className="text-xs mt-1">
                              Kéo & thả hoặc nhấp để chọn (có thể chọn nhiều)
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageSelect(e.target.files);
                            }
                          }}
                          disabled={isUploadingImage || isSubmitting}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  newImagePreviews.forEach((preview) => {
                    if (preview?.url) {
                      URL.revokeObjectURL(preview.url);
                    }
                  });
                  setIsEditDialogOpen(false);
                  setNewImagePreviews([]);
                }}
                disabled={isSubmitting || isUploadingImage}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                {isSubmitting || isUploadingImage
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailPart(null);
          }
          setIsDetailDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phụ tùng</DialogTitle>
            <DialogDescription>
              Xem nhanh thông tin phụ tùng. Không thể chỉnh sửa tại đây.
            </DialogDescription>
          </DialogHeader>
          {detailPart ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tên sản phẩm</label>
                <Input
                  value={detailPart.name || "Chưa cập nhật"}
                  readOnly
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Thương hiệu</label>
                  <Input
                    value={detailPart.brand || "Chưa rõ"}
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mã sản phẩm</label>
                  <Input
                    value={`#${detailPart._id?.slice(-6).toUpperCase()}`}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá bán</label>
                  <Input
                    value={formatPrice(detailPart.sellingPrice || 0)}
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Giá nhập</label>
                  <Input
                    value={formatPrice(detailPart.costPrice || 0)}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Số lượng tồn</label>
                  <Input
                    value={`${detailPart.quantity || 0} cái`}
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  {(() => {
                    const statusInfo = getDisplayStatus(detailPart);
                    return (
                      <div className="px-3 py-2 rounded border text-sm bg-gray-50">
                        <span className={statusInfo.color}>
                          {statusInfo.text}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={detailPart.description || "Chưa có mô tả"}
                  readOnly
                  disabled
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Dòng xe tương thích
                </label>
                {detailPart.compatible_model_ids &&
                detailPart.compatible_model_ids.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(() => {
                      // Create a map of model IDs to model objects from groupedModels
                      const modelMap = new Map();
                      groupedModels.forEach((group) => {
                        group.models.forEach((model) => {
                          modelMap.set(model._id, {
                            ...model,
                            brand: group.brand,
                          });
                        });
                      });

                      // Extract model IDs from compatible_model_ids
                      const modelIds = detailPart.compatible_model_ids.map(
                        (item) =>
                          typeof item === "object" && item._id ? item._id : item
                      );

                      // Get model info from map or use the original item
                      const modelsWithInfo = modelIds.map((id) => {
                        const modelInfo = modelMap.get(id);
                        if (modelInfo) {
                          return modelInfo;
                        }
                        // Fallback: try to find in original compatible_model_ids
                        const originalItem =
                          detailPart.compatible_model_ids.find(
                            (item) =>
                              (typeof item === "object" && item._id === id) ||
                              item === id
                          );
                        return (
                          originalItem || {
                            _id: id,
                            name: `Model ID: ${id}`,
                            brand: "",
                          }
                        );
                      });

                      return modelsWithInfo.map((model, index) => (
                        <div
                          key={model._id || index}
                          className="px-3 py-2 rounded border bg-gray-50 text-sm"
                        >
                          {model.brand && model.name
                            ? `${model.brand} ${model.name}`
                            : model.name
                            ? model.name
                            : `Model ID: ${model._id || model}`}
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có dòng xe tương thích
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Hình ảnh</label>
                {detailPart.media && detailPart.media.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailPart.media.map((media) => (
                      <img
                        key={media.publicId || media.url}
                        src={media.url}
                        alt={detailPart.name}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có hình ảnh</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Không thể tải thông tin phụ tùng.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toggleConfirm.open} onOpenChange={(open) => setToggleConfirm({ open, part: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi trạng thái</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {toggleConfirm.action} sản phẩm này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkToggleConfirm.open} onOpenChange={(open) => setBulkToggleConfirm({ open, action: null, count: 0 })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi trạng thái</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {bulkToggleConfirm.action} {bulkToggleConfirm.count} sản phẩm đã chọn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkToggle}
              disabled={isTogglingStatus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isTogglingStatus ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
