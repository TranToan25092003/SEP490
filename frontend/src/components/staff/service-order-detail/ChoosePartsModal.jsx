import { useEffect, useState, useCallback } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PaginationControl } from "@/components/global/AdminPagination";
import { customFetch } from "@/utils/customAxios";
import { formatPrice } from "@/lib/utils";

const ChoosePartsModal = NiceModal.create(() => {
  const modal = useModal();
  const [parts, setParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const fetchParts = useCallback(async (page = 1, search = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await customFetch(
        `/manager/parts?${params.toString()}`
      );

      if (response.data.success) {
        setParts(response.data.data || []);
        setPagination(response.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        });
      } else {
        throw new Error(response.data.message || "Failed to fetch parts");
      }
    } catch (err) {
      setError(err.message || "Lỗi khi tải phụ tùng");
      console.error("Error fetching parts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts(1, "");
  }, [fetchParts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParts(1, searchTerm);
  };

  const handlePageChange = (page) => {
    fetchParts(page, searchTerm);
  };

  const handlePartToggle = (part) => {
    setSelectedParts((prev) => {
      const isSelected = prev.some((p) => p._id === part._id);
      return isSelected
        ? prev.filter((p) => p._id !== part._id)
        : [...prev, part];
    });
  };

  const handleConfirm = () => {
    modal.resolve(selectedParts);
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("Part selection cancelled"));
    modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn Phụ Tùng</DialogTitle>
          <DialogDescription>
            Tìm kiếm và chọn một hoặc nhiều phụ tùng để thêm vào lệnh sửa chữa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả, mã phụ tùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              Tìm kiếm
            </Button>
          </div>
        </form>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button size="sm" onClick={() => fetchParts(pagination.currentPage, searchTerm)}>
                Thử Lại
              </Button>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Không tìm thấy phụ tùng nào</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {parts.map((part) => (
                  <div key={part._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded border">
                    <Checkbox
                      id={part._id}
                      checked={selectedParts.some((p) => p._id === part._id)}
                      onCheckedChange={() => handlePartToggle(part)}
                      className="mt-1"
                    />
                    <label htmlFor={part._id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{part.name}</div>
                          {part.code && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Mã: {part.code}
                            </div>
                          )}
                          {part.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {part.description}
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            {part.brand && <span>Thương hiệu: {part.brand}</span>}
                            {part.quantity !== undefined && (
                              <span className={part.quantity > 0 ? "text-green-600" : "text-red-600"}>
                                Tồn kho: {part.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {part.sellingPrice !== undefined && (
                            <div className="font-semibold text-sm text-primary">
                              {formatPrice(part.sellingPrice)}
                            </div>
                          )}
                          {part.costPrice !== undefined && (
                            <div className="text-xs text-gray-500">
                              Giá vốn: {formatPrice(part.costPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 0 && (
                <PaginationControl
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedParts.length === 0 || isLoading || !!error}
          >
            Xác Nhận ({selectedParts.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ChoosePartsModal;
