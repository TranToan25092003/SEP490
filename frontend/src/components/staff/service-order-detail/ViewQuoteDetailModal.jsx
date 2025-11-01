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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { getQuoteById } from "@/api/quotes";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import { Package, Wrench } from "lucide-react";
import { getQuoteStatusBadgeVariant, translateQuoteStatus } from "@/utils/enumsTranslator";

const ViewQuoteDetailModal = NiceModal.create(({ quoteId }) => {
  const modal = useModal();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuoteDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuoteById(quoteId);
      setQuote(data);
    } catch (err) {
      setError(err.message || "Lỗi khi tải chi tiết báo giá");
      console.error("Error fetching quote detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteDetail();
    }
  }, [quoteId, fetchQuoteDetail]);

  const handleClose = () => {
    modal.remove();
  };

  const { subtotal, tax, grandTotal } = quote ?? {};

  const groupedItems = quote?.items?.reduce((acc, item) => {
    const type = item.type || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {}) || {};

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi Tiết Báo Giá</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về báo giá và các hạng mục
          </DialogDescription>
        </DialogHeader>

        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button size="sm" onClick={fetchQuoteDetail}>
                Thử Lại
              </Button>
            </div>
          ) : !quote ? (
            <div className="text-center py-12 text-gray-500">
              <p>Không tìm thấy báo giá</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quote Header Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Mã báo giá</p>
                    <p className="font-mono font-semibold">{quote.id?.slice(-8) || "N/A"}</p>
                  </div>
                  <Badge className="rounded-full" variant={getQuoteStatusBadgeVariant(quote.status)}>
                    {translateQuoteStatus(quote.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Ngày tạo</p>
                    <p className="font-medium">
                      {quote.createdAt ? formatDateTime(quote.createdAt) : "N/A"}
                    </p>
                  </div>
                  {quote.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                      <p className="font-medium">
                        {quote.updatedAt ? formatDateTime(quote.updatedAt) : "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                {quote.status === "rejected" && quote.rejected_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-gray-600 mb-1">Lý do từ chối</p>
                    <p className="text-sm text-red-700">{quote.rejected_reason}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Hạng mục báo giá</h4>

                {/* Services Section */}
                {groupedItems.service && groupedItems.service.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Wrench className="h-4 w-4" />
                      <span>Dịch vụ ({groupedItems.service.length})</span>
                    </div>
                    <div className="space-y-2">
                      {groupedItems.service.map((item, index) => (
                        <div
                          key={item._id || `service-${index}`}
                          className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name || "Không có tên"}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Số lượng: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parts Section */}
                {groupedItems.part && groupedItems.part.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Package className="h-4 w-4" />
                      <span>Phụ tùng ({groupedItems.part.length})</span>
                    </div>
                    <div className="space-y-2">
                      {groupedItems.part.map((item, index) => (
                        <div
                          key={item._id || `part-${index}`}
                          className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name || "Không có tên"}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Số lượng: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!quote.items || quote.items.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border rounded-lg">
                    <p>Báo giá chưa có hạng mục nào</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals Summary */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng cộng</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thuế VAT</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Tổng thanh toán</span>
                  <span className="font-bold text-xl text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ViewQuoteDetailModal;
