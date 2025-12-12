import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  TableFooter,
} from "@/components/ui/table";
import { Check, ChevronsUpDown, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { customFetch } from "@/utils/customAxios";
import { uploadPartImage, validateFile } from "@/utils/uploadCloudinary";
import { toast } from "sonner";
import DatePicker from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";

const ModelCompatibilityTree = ({
  groupedModels,
  selectedIds,
  onSelectionChange,
}) => {
  const [filter, setFilter] = useState("");

  const handleModelSelect = (modelId, isSelected) => {
    const newIds = new Set(selectedIds);
    if (isSelected) {
      newIds.delete(modelId);
    } else {
      newIds.add(modelId);
    }
    onSelectionChange(Array.from(newIds));
  };

  const handleBrandSelectAll = (brandModels, isAllSelected) => {
    const modelIdsInBrand = brandModels.map((m) => m._id);
    const newIds = new Set(selectedIds);

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
          const modelsInBrandIds = group.models.map((m) => m._id);
          const selectedInBrandCount = modelsInBrandIds.filter((id) =>
            selectedIds.includes(id)
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
                  const isSelected = selectedIds.includes(model._id);
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

export default function CreateGoodsReceipt() {
  const navigate = useNavigate();

  // Form state for goods receipt
  const [formData, setFormData] = useState({
    supplier: {
      name: "",
      contact: "",
      address: "",
      phone: "",
      taxCode: "",
    },
    warehouseLocation: "Kho chính",
    notes: "",
    receivedDate: new Date().toISOString().split("T")[0],
  });

  // Items table state
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search functionality
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add new product modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    brand: "",
    sellingPrice: "",
    costPrice: "",
    description: "",
    compatible_model_ids: [],
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [previews, setPreviews] = useState([]); // { file, url, uploaded }
  const [groupedModels, setGroupedModels] = useState([]);

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

  // Debounced search function
  let timeoutId;
  const debouncedSearch = (query) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      searchParts(query);
    }, 300);
  };

  // Search for parts
  const searchParts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await customFetch(
        `/manager/parts/search?q=${encodeURIComponent(query)}`
      );
      setSearchResults(response.data.parts || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Lỗi tìm kiếm", {
        description: "Không thể tìm kiếm sản phẩm. Vui lòng thử lại.",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add item to table
  const addItem = (part) => {
    const newItem = {
      id: Date.now(), // temporary ID
      partId: part._id,
      sequenceNumber: items.length + 1,
      partName: part.name,
      partCode: part.code,
      unit: "cái",
      quantityOnDocument: 0,
      quantityActuallyReceived: 0,
      unitPrice: 0,
      totalAmount: 0,
      condition: "new",
      notes: "",
    };
    setItems([...items, newItem]);
    setSearchOpen(false);
    setSearchValue("");
    setSearchResults([]);
  };

  // Handle image upload
  const onFiles = useCallback((files) => {
    const validFiles = [];
    const newErrors = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });

      if (validation.isValid) {
        validFiles.push({
          file,
          url: URL.createObjectURL(file),
          uploaded: false,
        });
      } else {
        newErrors.push(`File ${file.name}: ${validation.errors.join(", ")}`);
      }
    });

    if (newErrors.length > 0) {
      toast.error("Lỗi file", {
        description: newErrors.join("; "),
      });
    }

    if (validFiles.length > 0) {
      setPreviews((prev) => [...prev, ...validFiles]);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  const onPick = useCallback(
    (e) => {
      if (e.target?.files?.length) onFiles(e.target.files);
    },
    [onFiles]
  );

  const removePreview = useCallback((idx) => {
    setPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      try {
        if (removed?.url) URL.revokeObjectURL(removed.url);
      } catch (error) {
        console.warn("Failed to revoke object URL:", error);
      }
      return next;
    });
  }, []);

  // Handle create new product
  const handleCreateProduct = async () => {
    if (!newProductData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!newProductData.sellingPrice || newProductData.sellingPrice <= 0) {
      toast.error("Vui lòng nhập giá bán hợp lệ");
      return;
    }
    if (!newProductData.costPrice || newProductData.costPrice <= 0) {
      toast.error("Vui lòng nhập giá nhập hợp lệ");
      return;
    }

    setIsCreatingProduct(true);
    try {
      // Upload images first
      const uploadedMedia = [];
      for (const preview of previews) {
        if (!preview.uploaded && preview.file) {
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
            setIsCreatingProduct(false);
            return;
          }
        }
      }

      const submitData = {
        name: newProductData.name,
        brand: newProductData.brand || "",
        sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
        costPrice: parseFloat(newProductData.costPrice) || 0,
        quantity: 0, // Set default quantity to 0, will be updated via goods receipt
        description: newProductData.description || "",
        status: "active",
        compatible_model_ids: newProductData.compatible_model_ids || [],
        media: uploadedMedia,
      };

      const response = await customFetch("/manager/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: submitData,
      });

      if (response.data.success) {
        const newPart = response.data.data;
        toast.success("Thành công", {
          description: "Sản phẩm đã được tạo thành công",
        });

        // Add the new product to the items table
        addItem(newPart);

        // Reset form and close modal
        setNewProductData({
          name: "",
          brand: "",
          sellingPrice: "",
          costPrice: "",
          description: "",
          compatible_model_ids: [],
        });
        setPreviews([]);
        setIsAddProductModalOpen(false);
      } else {
        throw new Error(response.data.message || "Không thể tạo sản phẩm");
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể tạo sản phẩm",
      });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Update item in table
  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Auto-calculate total amount
          if (field === "quantityActuallyReceived" || field === "unitPrice") {
            updated.totalAmount =
              updated.quantityActuallyReceived * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Handle number input to remove leading zeros
  const handleNumberInput = (id, field, value) => {
    // Remove leading zeros and convert to number
    const cleanValue = value === "" ? 0 : parseInt(value, 10) || 0;
    updateItem(id, field, cleanValue);
  };

  // Remove item from table
  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
    // Recalculate sequence numbers
    setItems((prev) =>
      prev.map((item, index) => ({
        ...item,
        sequenceNumber: index + 1,
      }))
    );
  };

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Submit goods receipt
  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    if (!formData.supplier.name.trim()) {
      toast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create goods receipt
      const receiptData = {
        ...formData,
        documentDate: formData.receivedDate, // Use receivedDate as documentDate
        totalAmount,
        status: "completed",
        items: items.map((item) => ({
          partId: item.partId,
          sequenceNumber: item.sequenceNumber,
          partName: item.partName,
          partCode: item.partCode,
          unit: item.unit,
          quantityOnDocument: item.quantityOnDocument,
          quantityActuallyReceived: item.quantityActuallyReceived,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
          condition: item.condition,
          notes: item.notes,
          status: "received",
        })),
      };

      // Debug: Log the data being sent
      console.log("Receipt data being sent:", {
        supplier: receiptData.supplier,
        supplierName: receiptData.supplier?.name,
        items: receiptData.items,
        itemsLength: receiptData.items.length,
        totalAmount: receiptData.totalAmount,
        warehouseLocation: receiptData.warehouseLocation,
        receivedDate: receiptData.receivedDate,
        notes: receiptData.notes,
      });

      // Additional validation
      if (!receiptData.supplier?.name) {
        console.error("Missing supplier name");
        toast.error("Thiếu tên nhà cung cấp");
        return;
      }

      if (!receiptData.items || receiptData.items.length === 0) {
        console.error("Missing items");
        toast.error("Thiếu danh sách sản phẩm");
        return;
      }

      // Check each item has required fields
      for (let i = 0; i < receiptData.items.length; i++) {
        const item = receiptData.items[i];
        if (!item.partId) {
          console.error(`Missing partId for item ${i}:`, item);
          toast.error(`Thiếu ID sản phẩm ở dòng ${i + 1}`);
          return;
        }
        if (!item.partName) {
          console.error(`Missing partName for item ${i}:`, item);
          toast.error(`Thiếu tên sản phẩm ở dòng ${i + 1}`);
          return;
        }
        if (!item.partCode) {
          console.error(`Missing partCode for item ${i}:`, item);
          toast.error(`Thiếu mã sản phẩm ở dòng ${i + 1}`);
          return;
        }
      }

      const response = await customFetch("/manager/goods-receipt", {
        method: "POST",
        data: receiptData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        // Update part quantities and cost prices
        try {
          for (const item of receiptData.items) {
            // Get current part data
            const currentPartResponse = await customFetch(
              `/manager/parts/${item.partId}`
            );
            const currentPart = currentPartResponse.data.data;
            const currentQuantity = currentPart.quantityInStock || 0;
            const newQuantity = currentQuantity + item.quantityActuallyReceived;

            // Update with new quantity and cost price (from unitPrice in receipt)
            const updateData = {
              quantityInStock: newQuantity,
            };

            // Update costPrice with the latest unitPrice from goods receipt
            if (item.unitPrice && item.unitPrice > 0) {
              updateData.costPrice = item.unitPrice;
            }

            await customFetch(`/manager/parts/${item.partId}`, {
              method: "PUT",
              data: updateData,
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log(
              `Updated part ${item.partName}: quantity ${currentQuantity} + ${
                item.quantityActuallyReceived
              } = ${newQuantity}, costPrice = ${item.unitPrice || "unchanged"}`
            );
          }
        } catch (updateError) {
          console.error(
            "Failed to update part quantities and prices:",
            updateError
          );
          toast.error("Lỗi cập nhật sản phẩm", {
            description:
              "Phiếu nhập đã tạo nhưng không thể cập nhật số lượng và giá nhập sản phẩm",
          });
        }

        // PDF will be generated on-demand when viewing receipt details

        toast.success("Thành công", {
          description:
            "Phiếu nhập kho đã được tạo và cập nhật số lượng, giá nhập sản phẩm",
        });

        navigate("/manager/goods-receipt-list");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể tạo phiếu nhập kho",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo phiếu nhập kho</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/manager/goods-receipt-list")}
        >
          Quay lại
        </Button>
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thông tin nhà cung cấp</h2>
          <div className="space-y-3">
            <Input
              placeholder="Tên nhà cung cấp *"
              value={formData.supplier.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, name: e.target.value },
                })
              }
            />
            <Input
              placeholder="Người liên hệ"
              value={formData.supplier.contact}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, contact: e.target.value },
                })
              }
            />
            <Input
              placeholder="Địa chỉ"
              value={formData.supplier.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, address: e.target.value },
                })
              }
            />
            <Input
              placeholder="Số điện thoại"
              value={formData.supplier.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, phone: e.target.value },
                })
              }
            />
            <Input
              placeholder="Mã số thuế"
              value={formData.supplier.taxCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, taxCode: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Receipt Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thông tin phiếu nhập</h2>
          <div className="space-y-3">
            <DatePicker
              label="Ngày nhập hàng"
              value={formData.receivedDate}
              onChange={(date) =>
                setFormData({
                  ...formData,
                  receivedDate: date,
                })
              }
              placeholder="Chọn ngày nhập hàng"
            />
            <Input
              placeholder="Địa điểm nhập kho"
              value={formData.warehouseLocation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  warehouseLocation: e.target.value,
                })
              }
            />
            <Textarea
              placeholder="Ghi chú"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Items Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
          <Button
            onClick={() => setIsAddProductModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm mới
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Mã sản phẩm</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Số lượng theo chứng từ</TableHead>
              <TableHead>Số lượng thực nhập</TableHead>
              <TableHead>Đơn giá</TableHead>
              <TableHead>Thành tiền</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add Product Row */}
            <TableRow className="bg-gray-50/50 hover:bg-gray-50">
              <TableCell colSpan={9} className="p-2">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-center gap-2 h-10 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm sản phẩm vào phiếu nhập
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchValue}
                        onValueChange={(value) => {
                          setSearchValue(value);
                          debouncedSearch(value);
                        }}
                      />
                      <CommandList>
                        {isSearching ? (
                          <CommandEmpty>Đang tìm kiếm...</CommandEmpty>
                        ) : searchResults.length === 0 && searchValue.trim() ? (
                          <CommandEmpty>
                            Không tìm thấy sản phẩm nào với từ khóa "
                            {searchValue}"
                          </CommandEmpty>
                        ) : searchResults.length === 0 ? (
                          <CommandEmpty>
                            Nhập từ khóa để tìm kiếm sản phẩm
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {searchResults.map((part) => (
                              <CommandItem
                                key={part._id}
                                value={part.name}
                                onSelect={() => {
                                  addItem(part);
                                  setSearchOpen(false);
                                  setSearchValue("");
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {part.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Mã: {part.code} | Tồn: {part.quantity} |
                                      Giá: {formatPrice(part.sellingPrice)}
                                    </div>
                                  </div>
                                  <Plus className="h-4 w-4 ml-2 text-primary" />
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>

            {/* Product Items */}
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có sản phẩm nào. Nhấn vào nút "Thêm sản phẩm vào phiếu
                  nhập" ở trên để thêm sản phẩm.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sequenceNumber}</TableCell>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate" title={item.partName}>
                      {item.partName}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.partCode}
                  </TableCell>
                  <TableCell>
                    <div className="w-[100px] px-3 py-2 text-sm">Cái</div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantityOnDocument || ""}
                      onChange={(e) =>
                        handleNumberInput(
                          item.id,
                          "quantityOnDocument",
                          e.target.value
                        )
                      }
                      className="w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantityActuallyReceived || ""}
                      onChange={(e) =>
                        handleNumberInput(
                          item.id,
                          "quantityActuallyReceived",
                          e.target.value
                        )
                      }
                      className="w-[120px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        handleNumberInput(item.id, "unitPrice", e.target.value)
                      }
                      className="w-[120px]"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(item.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {items.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-bold">
                  Tổng cộng:
                </TableCell>
                <TableCell className="font-bold">
                  {formatPrice(totalAmount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Submit Section */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate("/manager/goods-receipt-list")}
        >
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Hoàn thành"}
        </Button>
      </div>

      {/* Add New Product Modal */}
      <Dialog
        open={isAddProductModalOpen}
        onOpenChange={setIsAddProductModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            <DialogDescription>
              Tạo sản phẩm mới và tự động thêm vào phiếu nhập kho.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên sản phẩm *</label>
              <Input
                placeholder="Nhập tên sản phẩm"
                value={newProductData.name}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Thương hiệu</label>
              <Input
                placeholder="VD: Honda, Yamaha"
                value={newProductData.brand}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    brand: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Dòng xe tương thích</label>
              <ModelCompatibilityTree
                groupedModels={groupedModels}
                selectedIds={newProductData.compatible_model_ids}
                onSelectionChange={(newIds) =>
                  setNewProductData({
                    ...newProductData,
                    compatible_model_ids: newIds,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá bán *</label>
                <Input
                  type="number"
                  placeholder="VD: 120000"
                  value={newProductData.sellingPrice}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
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
                  value={newProductData.costPrice}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      costPrice: e.target.value,
                    })
                  }
                  required
                  min="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                placeholder="Mô tả sản phẩm"
                rows={4}
                value={newProductData.description}
                onChange={(e) =>
                  setNewProductData({
                    ...newProductData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Hình ảnh</label>
              <div
                className="h-[150px] rounded-[8px] border border-dashed grid place-items-center text-[#656575] cursor-pointer hover:bg-gray-50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <div className="text-center">
                  Kéo & thả ảnh vào đây hoặc
                  <label className="ml-1 underline cursor-pointer">
                    chọn file
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onPick}
                    />
                  </label>
                </div>
              </div>

              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {previews.map((p, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={p.url}
                        alt="preview"
                        className="w-full h-28 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removePreview(idx)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-red-600 text-white w-6 h-6 grid place-items-center shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddProductModalOpen(false)}
              disabled={isCreatingProduct}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreateProduct}
              disabled={isCreatingProduct}
            >
              {isCreatingProduct ? "Đang tạo..." : "Tạo và thêm vào phiếu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
