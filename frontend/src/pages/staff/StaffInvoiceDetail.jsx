import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchInvoiceDetail } from "@/api/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export default function StaffInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        Quay lại
      </Button>
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
                  <div className="text-sm text-muted-foreground">Mã hóa đơn</div>
                  <div className="text-lg font-semibold font-mono">{invoice.invoiceNumber || invoice.id}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <div>{statusBadge(invoice.status)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Lệnh sửa chữa</div>
                  <div className="font-mono">{invoice.serviceOrderNumber || invoice.serviceOrderId}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Khách hàng</div>
                  <div>{invoice.customerName || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Biển số</div>
                  <div>{invoice.licensePlate || "-"}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Ngày tạo</div>
                  <div>{formatDateTime(invoice.createdAt)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Ngày cập nhật</div>
                  <div>{formatDateTime(invoice.updatedAt)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Phương thức thanh toán</div>
                  <div>{invoice.paymentMethod ? invoice.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản" : "-"}</div>
                </div>
                {invoice.confirmedBy && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Người xác nhận</div>
                    <div>{invoice.confirmedBy}</div>
                  </div>
                )}
                {invoice.confirmedAt && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Thời gian xác nhận</div>
                    <div>{formatDateTime(invoice.confirmedAt)}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Tóm tắt thanh toán</div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính</span>
                    <span>{formatPrice(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Thuế</span>
                    <span>{formatPrice(invoice.tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Chi tiết hạng mục</div>
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
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.type === "part" ? "Phụ tùng" : "Dịch vụ"}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
