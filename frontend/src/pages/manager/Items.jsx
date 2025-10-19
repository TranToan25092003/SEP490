import { useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import iconDelete from "@/assets/admin/figma_selection/77d1c5cb4524f3bd944adaeee5f86d34af0a071e.svg";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Link } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

export default function ManagerItems() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Handle delete single item
  const handleDeleteItem = async (partId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const response = await customFetch(`/manager/parts/${partId}`, {
        method: "DELETE",
      });

      if (response.data.success) {
        toast.success("Thành công", {
          description: "Sản phẩm đã được xóa",
        });
        // Refresh the page
        window.location.reload();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể xóa sản phẩm",
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để xóa");
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn?`
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await customFetch("/manager/parts/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedItems }),
      });

      if (response.data.success) {
        toast.success("Thành công", {
          description: `${selectedItems.length} sản phẩm đã được xóa`,
        });
        setSelectedItems([]);
        // Refresh the page
        window.location.reload();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể xóa sản phẩm",
      });
    } finally {
      setIsDeleting(false);
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
            <Link to="/manager/goods-receipt">+ Phiếu nhập kho</Link>
          </Button>
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : `Xóa (${selectedItems.length})`}
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
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
                    <div className="leading-4">
                      <div className="text-[#2e2e3a] text-[14px] font-bold tracking-[-0.126px]">
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
                  <div className="flex items-center gap-1">
                    <img
                      src={statusTick}
                      alt="ok"
                      className="w-[18px] h-[18px]"
                    />
                    <span className="text-[12px] text-[#24ca49]">
                      {part.quantity > 0 ? "Có sẵn" : "Hết hàng"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(part.sellingPrice)}</TableCell>
                <TableCellMinContent>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center"
                      onClick={() =>
                        navigate(`/manager/items/edit/${part._id}`)
                      }
                    >
                      <img
                        src={iconEdit}
                        alt="edit"
                        className="w-[14px] h-[14px]"
                      />
                    </button>
                    <button
                      className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center"
                      onClick={() => handleDeleteItem(part._id)}
                    >
                      <img
                        src={iconDelete}
                        alt="delete"
                        className="w-[14px] h-[14px]"
                      />
                    </button>
                  </div>
                </TableCellMinContent>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}
    </div>
  );
}
