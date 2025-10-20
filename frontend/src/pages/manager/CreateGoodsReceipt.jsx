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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Check, ChevronsUpDown, Plus, Search, Trash2 } from "lucide-react";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import DatePicker from "@/components/ui/date-picker";

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
        // Update part quantities
        try {
          for (const item of receiptData.items) {
            // Get current part data
            const currentPartResponse = await customFetch(
              `/manager/parts/${item.partId}`
            );
            const currentQuantity =
              currentPartResponse.data.data.quantityInStock || 0;
            const newQuantity = currentQuantity + item.quantityActuallyReceived;

            // Update with new quantity
            await customFetch(`/manager/parts/${item.partId}`, {
              method: "PUT",
              data: {
                quantityInStock: newQuantity,
              },
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log(
              `Updated quantity for part ${item.partName}: ${currentQuantity} + ${item.quantityActuallyReceived} = ${newQuantity}`
            );
          }
        } catch (updateError) {
          console.error("Failed to update part quantities:", updateError);
          toast.error("Lỗi cập nhật số lượng", {
            description:
              "Phiếu nhập đã tạo nhưng không thể cập nhật số lượng sản phẩm",
          });
        }

        // PDF will be generated on-demand when viewing receipt details

        toast.success("Thành công", {
          description:
            "Phiếu nhập kho đã được tạo và cập nhật số lượng sản phẩm",
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
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <Search className="h-4 w-4" />
                Tìm sản phẩm...
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
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
                      Không tìm thấy sản phẩm nào với từ khóa "{searchValue}"
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
                          onSelect={() => addItem(part)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{part.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Mã: {part.code} | Tồn: {part.quantity} | Giá:{" "}
                                {formatPrice(part.sellingPrice)}
                              </div>
                            </div>
                            <Plus className="h-4 w-4" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có sản phẩm nào. Hãy tìm kiếm và thêm sản phẩm.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sequenceNumber}</TableCell>
                  <TableCell>{item.partName}</TableCell>
                  <TableCell>{item.partCode}</TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(value) =>
                        updateItem(item.id, "unit", value)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cái">Cái</SelectItem>
                        <SelectItem value="bộ">Bộ</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="lít">Lít</SelectItem>
                        <SelectItem value="mét">Mét</SelectItem>
                        <SelectItem value="cuộn">Cuộn</SelectItem>
                        <SelectItem value="hộp">Hộp</SelectItem>
                        <SelectItem value="thùng">Thùng</SelectItem>
                      </SelectContent>
                    </Select>
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
    </div>
  );
}
