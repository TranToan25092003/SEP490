import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStaffInvoices, confirmInvoicePayment } from "@/api/invoices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Chưa thanh toán", value: "unpaid" },
  { label: "Đã thanh toán", value: "paid" },
];

export default function StaffInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("unpaid");
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  const loadInvoices = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const response = await fetchStaffInvoices({
          page,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        setInvoices(response.data || []);
        setPagination(
          response.pagination || { currentPage: page, totalPages: page }
        );
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách hóa đơn");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadInvoices(1);
  }, [loadInvoices]);

  const handleChangePage = (direction) => {
    const nextPage = pagination.currentPage + direction;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    loadInvoices(nextPage);
  };

  const handleConfirmPayment = async (invoiceId) => {
    setConfirmingId(invoiceId);
    try {
      await confirmInvoicePayment(invoiceId);
      toast.success("Đã xác nhận thanh toán hóa đơn");
      await loadInvoices(pagination.currentPage);
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Không thể xác nhận thanh toán";
      toast.error(message);
    } finally {
      setConfirmingId(null);
    }
  };

  const hasInvoices = invoices.length > 0;

  const statusBadge = useCallback((status) => {
    const variant = status === "paid" ? "success" : "destructive";
    const label = status === "paid" ? "Đã thanh toán" : "Chưa thanh toán";
    return <Badge variant={variant}>{label}</Badge>;
  }, []);

  const toolbar = useMemo(
    () => (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadInvoices(1)}
            disabled={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>
    ),
    [statusFilter, loadInvoices, loading]
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle>Quản lý hóa đơn thanh toán</CardTitle>
          {toolbar}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : hasInvoices ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã hóa đơn</TableHead>
                      <TableHead>Lệnh sửa chữa</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Biển số</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium font-mono">
                          {invoice.invoiceNumber || invoice.id}
                        </TableCell>
                        <TableCell className="font-mono">
                          {invoice.serviceOrderNumber || invoice.serviceOrderId}
                        </TableCell>
                        <TableCell>{invoice.customerName || "-"}</TableCell>
                        <TableCell>{invoice.licensePlate || "-"}</TableCell>
                        <TableCell>
                          {formatDateTime(invoice.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatPrice(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>{statusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/staff/invoices/${invoice.id}`)
                            }
                          >
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            disabled={
                              invoice.status === "paid" ||
                              confirmingId === invoice.id
                            }
                            onClick={() => handleConfirmPayment(invoice.id)}
                          >
                            {confirmingId === invoice.id
                              ? "Đang xác nhận..."
                              : "Xác nhận thanh toán"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleChangePage(-1)}
                    disabled={pagination.currentPage === 1 || loading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleChangePage(1)}
                    disabled={
                      pagination.currentPage === pagination.totalPages ||
                      loading
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Chưa có hóa đơn nào.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
