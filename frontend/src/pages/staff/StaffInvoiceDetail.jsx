import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchInvoiceDetail } from "@/api/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Download, Loader2 } from "lucide-react";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";

export default function StaffInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const subtotal = Number(invoice?.subtotal || 0);
  const discountAmount = Number(invoice?.discountAmount || 0);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const vatAmount = Math.round(taxableAmount * 0.1);
  const finalTotal = taxableAmount + vatAmount;

  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      try {
        const response = await fetchInvoiceDetail(id);
        setInvoice(response.data);
      } catch (error) {
        console.error(error);
        const message =
          error.response?.data?.message || "Không thể tải chi tiết hóa đơn";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  const statusBadge = (status) => {
    const variant = status === "paid" ? "success" : "destructive";
    const label = status === "paid" ? "Đã thanh toán" : "Chưa thanh toán";
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleDownloadPDF = async () => {
    if (!invoice) {
      toast.error("Không có dữ liệu hóa đơn để tải xuống");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const invoiceDataForPDF = {
        ...invoice,
      };

      const pdfBlob = await generateInvoicePDF(invoiceDataForPDF);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hoa-don-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Tải hóa đơn thành công!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Không thể tạo file PDF. Vui lòng thử lại.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Đang tạo file PDF...
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        {invoice && (
          <Button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
            disabled={isGeneratingPDF}
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? "Đang tạo PDF..." : "Tải PDF"}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Mã hóa đơn
                  </div>
                  <div className="text-lg font-semibold font-mono">
                    {invoice.invoiceNumber || invoice.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Trạng thái
                  </div>
                  <div>{statusBadge(invoice.status)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Lệnh sửa chữa
                  </div>
                  <div className="font-mono">
                    {invoice.serviceOrderNumber || invoice.serviceOrderId}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Khách hàng
                  </div>
                  <div>{invoice.customerName || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Biển số</div>
                  <div>
                    {invoice.licensePlate ||
                      invoice.vehicleLicensePlate ||
                      invoice.vehicle?.licensePlate ||
                      "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Ngày tạo</div>
                  <div>{formatDateTime(invoice.createdAt)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Ngày cập nhật
                  </div>
                  <div>{formatDateTime(invoice.updatedAt)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Phương thức thanh toán
                  </div>
                  <div>
                    {invoice.paymentMethod
                      ? invoice.paymentMethod === "cash"
                        ? "Tiền mặt"
                        : invoice.paymentMethod === "qr_code"
                        ? "Quét QR"
                        : "Chuyển khoản"
                      : "-"}
                  </div>
                </div>
                {invoice.confirmedBy && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Người xác nhận
                    </div>
                    <div>{invoice.confirmedBy}</div>
                  </div>
                )}
                {invoice.confirmedAt && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Thời gian xác nhận
                    </div>
                    <div>{formatDateTime(invoice.confirmedAt)}</div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Chi tiết hạng mục
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hạng mục</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(invoice.items ?? []).map((item, index) => (
                        <TableRow key={`${item.name}-${index}`}>
                          <TableCell className="max-w-xs">
                            <span className="block truncate" title={item.name}>
                              {item.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.type === "part" ? "Phụ tùng" : "Dịch vụ"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Tóm tắt thanh toán
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  {/* 1. Tổng tiền hàng & dịch vụ (chưa thuế) */}
                  <div className="flex justify-between text-sm">
                    <span>Tổng tiền hàng &amp; dịch vụ (chưa thuế)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {/* 2. Voucher giảm giá */}
                  <div className="flex justify-between text-sm">
                    <span>
                      Voucher giảm giá
                      {invoice.discountCode
                        ? ` (${invoice.discountCode})`
                        : ""}
                    </span>
                    <span className="text-emerald-600">
                      {discountAmount > 0
                        ? `-${formatPrice(discountAmount)}`
                        : "-"}
                    </span>
                  </div>
                  {/* 3. Giá trị tính thuế */}
                  <div className="flex justify-between text-sm border-t pt-3 mt-2">
                    <span>Giá trị tính thuế</span>
                    <span>{formatPrice(taxableAmount)}</span>
                  </div>
                  {/* 4. Thuế VAT (10%) */}
                  <div className="flex justify-between text-sm">
                    <span>Thuế VAT (10%)</span>
                    <span>{formatPrice(vatAmount)}</span>
                  </div>
                  {/* 5. Tổng thanh toán */}
                  <div className="flex justify-between text-base font-semibold border-t pt-3 mt-2">
                    <span>Tổng thanh toán</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Không tìm thấy hóa đơn.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
