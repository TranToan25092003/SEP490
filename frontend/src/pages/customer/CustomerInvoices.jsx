import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "@/components/global/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/global/EmptyState";
import { ClipboardList } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { fetchCustomerInvoices } from "@/api/invoices";
import AuthRequiredModal from "@/components/global/AuthRequiredModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function loader() {
  return fetchCustomerInvoices()
    .then((response) => ({
      invoices: response.data ?? [],
      requiresAuth: false,
      error: null,
    }))
    .catch((error) => {
      if (error.response?.status === 401) {
        return {
          invoices: [],
          requiresAuth: true,
          error: null,
        };
      }

      return {
        invoices: [],
        requiresAuth: false,
        error:
          error.response?.data?.message ||
          "Không thể tải danh sách hóa đơn. Vui lòng thử lại sau.",
      };
    });
}

const getStatusBadge = (status) => {
  if (status === "paid") {
    return <Badge variant="success">Đã thanh toán</Badge>;
  }

  return <Badge variant="destructive">Chưa thanh toán</Badge>;
};

const CustomerInvoices = () => {
  const { invoices, requiresAuth, error } = useLoaderData();
  const navigate = useNavigate();
  const [authModalVisible, setAuthModalVisible] = useState(requiresAuth);

  useEffect(() => {
    setAuthModalVisible(requiresAuth);
  }, [requiresAuth]);

  if (requiresAuth) {
    return (
      <>
        <AuthRequiredModal
          open={authModalVisible}
          onClose={() => {
            setAuthModalVisible(false);
            navigate(-1);
          }}
          featureName="xem hóa đơn"
        />
        <Container className="py-16">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-semibold">Vui lòng đăng nhập</h1>
            <p className="text-muted-foreground">
              Bạn cần đăng nhập để xem danh sách hóa đơn của mình.
            </p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <Container className="py-12 space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          Hóa đơn dịch vụ
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {(!invoices || invoices.length === 0) && !error ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có hóa đơn"
          subtitle="Bạn sẽ nhìn thấy hóa đơn khi đã hoàn tất dịch vụ tại gara."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground">
                  Mã hóa đơn
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground">
                  Trạng thái
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground">
                  Ngày tạo
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground">
                  Lệnh sửa chữa
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground">
                  Biển số
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground text-right">
                  Tổng cộng
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs text-muted-foreground text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">
                    {invoice.invoiceNumber || invoice.id}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(invoice.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.serviceOrderNumber ||
                      invoice.serviceOrderId ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.licensePlate || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatPrice(invoice.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/invoices/${invoice.id}`}>Xem chi tiết</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Container>
  );
};

CustomerInvoices.loader = loader;

export default CustomerInvoices;
