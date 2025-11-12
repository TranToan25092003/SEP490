import { useLoaderData, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "@/components/global/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/global/EmptyState";
import { ClipboardList, ArrowLeft } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { fetchCustomerInvoiceDetail } from "@/api/invoices";
import AuthRequiredModal from "@/components/global/AuthRequiredModal";

function loader({ params }) {
  return fetchCustomerInvoiceDetail(params.id)
    .then((response) => ({
      invoice: response.data || null,
      requiresAuth: false,
      error: null,
    }))
    .catch((error) => {
      if (error.response?.status === 401) {
        return {
          invoice: null,
          requiresAuth: true,
          error: null,
        };
      }

      return {
        invoice: null,
        requiresAuth: false,
        error:
          error.response?.data?.message ||
          "Không thể tải chi tiết hóa đơn. Vui lòng thử lại sau.",
      };
    });
}

const renderStatusBadge = (status) => {
  if (status === "paid") {
    return <Badge variant="success">Đã thanh toán</Badge>;
  }

  return <Badge variant="destructive">Chưa thanh toán</Badge>;
};

const renderPaymentMethod = (method) => {
  if (!method) return "Chưa xác định";
  return method === "cash" ? "Tiền mặt" : "Chuyển khoản";
};

const CustomerInvoiceDetail = () => {
  const { invoice, requiresAuth, error } = useLoaderData();
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
              Bạn cần đăng nhập để xem chi tiết hóa đơn của mình.
            </p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <Container className="py-12 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            Thông tin hóa đơn
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Xem chi tiết các hạng mục, chi phí và trạng thái thanh toán cho lần sửa chữa của bạn.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {!invoice && !error ? (
        <EmptyState
          icon={ClipboardList}
          title="Không tìm thấy hóa đơn"
          subtitle="Hãy kiểm tra lại mã hóa đơn hoặc liên hệ với chúng tôi để được hỗ trợ."
        />
      ) : null}

      {invoice && (
        <div className="space-y-8">
          <Card className="shadow-sm border border-border/60">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">
                    Mã hóa đơn
                  </div>
                  <div className="text-2xl font-semibold font-mono">
                    {invoice.id}
                  </div>
                  {renderStatusBadge(invoice.status)}
                </div>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Ngày tạo</div>
                    <div className="font-medium text-foreground">
                      {formatDateTime(invoice.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ngày cập nhật</div>
                    <div className="font-medium text-foreground">
                      {formatDateTime(invoice.updatedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Lệnh sửa chữa</div>
                    <div className="font-medium text-foreground">
                      {invoice.serviceOrderId || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Biển số xe</div>
                    <div className="font-medium text-foreground">
                      {invoice.licensePlate || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tên khách hàng</div>
                    <div className="font-medium text-foreground">
                      {invoice.customerName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Trạng thái thanh toán</div>
                    <div className="font-medium text-foreground">
                      {renderPaymentMethod(invoice.paymentMethod)}
                    </div>
                  </div>
                  {invoice.confirmedBy && (
                    <div>
                      <div className="text-muted-foreground">Xác nhận bởi</div>
                      <div className="font-medium text-foreground">
                        {invoice.confirmedBy}
                      </div>
                    </div>
                  )}
                  {invoice.confirmedAt && (
                    <div>
                      <div className="text-muted-foreground">Thời gian xác nhận</div>
                      <div className="font-medium text-foreground">
                        {formatDateTime(invoice.confirmedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="shadow-sm border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold uppercase tracking-wide">
                    Báo giá đã duyệt
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Danh sách các hạng mục dịch vụ và phụ tùng đã được thực hiện cho xe của bạn.
                  </p>
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
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="capitalize">
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
                      {(invoice.items ?? []).length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-sm text-muted-foreground py-6"
                          >
                            Không có hạng mục nào trong hóa đơn này.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold uppercase tracking-wide">
                    Tổng hợp &amp; xác nhận
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Chi tiết các khoản phí và số tiền cần thanh toán.
                  </p>
                </div>
                <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính</span>
                    <span className="font-medium">
                      {formatPrice(invoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Thuế (10%)</span>
                    <span className="font-medium">
                      {formatPrice(invoice.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(invoice.totalAmount)}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  Nếu bạn cần hỗ trợ thêm về hóa đơn, vui lòng liên hệ đội ngũ
                  chăm sóc khách hàng của Motormate.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
};

CustomerInvoiceDetail.loader = loader;

export default CustomerInvoiceDetail;

