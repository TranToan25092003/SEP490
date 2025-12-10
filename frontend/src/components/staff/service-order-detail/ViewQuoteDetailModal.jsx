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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getQuoteById } from "@/api/quotes";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import { Package, Wrench, AlertCircle } from "lucide-react";
import { getQuoteStatusBadgeVariant, translateQuoteStatus } from "@/utils/enumsTranslator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateQuotePDF } from "@/utils/quotePdfGenerator";
import { toast } from "sonner";

// Rejection Reason Schema
const rejectionReasonSchema = z.object({
  reason: z.string()
    .trim()
    .min(10, "Lý do từ chối phải có ít nhất 10 ký tự")
    .max(500, "Lý do từ chối không được vượt quá 500 ký tự")
});

// Rejection Reason Modal Component
const RejectionReasonModal = NiceModal.create(() => {
  const modal = useModal();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(rejectionReasonSchema),
    defaultValues: {
      reason: ""
    }
  });

  const onSubmit = async (data) => {
    modal.resolve(data.reason);
    modal.remove();
  };

  const handleClose = () => {
    reset();
    modal.resolve(null);
    modal.remove();
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Từ Chối Báo Giá
          </DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do từ chối báo giá này
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="required-asterisk">
              Lý do từ chối
            </Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do từ chối báo giá..."
              className={`min-h-[120px] resize-none ${errors.reason ? "border-red-500" : ""}`}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                {errors.reason.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Tối thiểu 10 ký tự, tối đa 500 ký tự
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác Nhận Từ Chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

const ViewQuoteDetailModal = NiceModal.create(({
  quoteId,
  allowAcceptReject = false,
  allowStaffConfirm = false,
  serviceOrder = null,
}) => {
  const modal = useModal();
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fetchQuoteDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuoteById(quoteId);
      
      // Check if quote exists and is valid
      if (!data) {
        throw new Error("Báo giá không tồn tại hoặc đã bị xóa");
      }
      
      setQuote(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Lỗi khi tải chi tiết báo giá";
      setError(errorMessage);
      console.error("Error fetching quote detail:", err);
      
      // If quote not found or invalid, show error but don't auto-close
      // Let user decide to close or retry
    } finally {
      setIsLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteDetail();
    }
  }, [quoteId, fetchQuoteDetail]);

  const handleDownloadPdf = async () => {
    if (!quote) {
      toast.error("Không có dữ liệu báo giá để xuất");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdfBlob = await generateQuotePDF({
        quoteNumber: quote.id,
        serviceOrderNumber:
          serviceOrder?.orderNumber || serviceOrder?.id || quote.serviceOrderId,
        customerName: serviceOrder?.customerName || "Khách hàng",
        licensePlate: serviceOrder?.licensePlate || "—",
        createdAt: quote.createdAt,
        status: quote.status,
        items: quote.items,
        subtotal: quote.subtotal,
        tax: quote.tax,
        grandTotal: quote.grandTotal,
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao-gia-${quote.id?.slice(-8) || "Motormate"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã tải báo giá!");
    } catch (pdfError) {
      console.error("Failed to generate quote PDF:", pdfError);
      toast.error("Không thể tạo file PDF, vui lòng thử lại");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

                {quote.status === "rejected" && quote.rejectedReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-gray-600 mb-1">Lý do từ chối</p>
                    <p className="text-sm text-red-700">{quote.rejectedReason}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Hạng mục báo giá</h4>

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

                {(!quote.items || quote.items.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border rounded-lg">
                    <p>Báo giá chưa có hạng mục nào</p>
                  </div>
                )}
              </div>

              <Separator />

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

        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !quote}
          >
            {isGeneratingPdf ? "Đang tạo PDF..." : "Tải báo giá"}
          </Button>
          <div className="flex flex-wrap gap-2 justify-end">
            {allowStaffConfirm && quote && quote.status === "pending" && (
              <Button
                onClick={() => {
                  modal.resolve({ action: "staff-confirm" });
                  handleClose();
                }}
              >
                Xác nhận báo giá hộ khách
              </Button>
            )}
            {allowAcceptReject && quote && quote.status === "pending" && (
              <>
              <Button
                variant="outline"
                onClick={async () => {
                  const reason = await NiceModal.show(RejectionReasonModal);
                  if (reason) {
                    modal.resolve({ action: "reject", reason });
                    handleClose();
                  }
                }}
              >
                Từ Chối
              </Button>
              <Button
                onClick={() => {
                  modal.resolve({ action: "accept" });
                  handleClose();
                }}
              >
                Chấp Nhận
              </Button>
              </>
          )}
            <Button
              variant="secondary"
              onClick={() => {
              modal.resolve({ action: "close" });
              handleClose();
              }}
            >
              Đóng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ViewQuoteDetailModal;
