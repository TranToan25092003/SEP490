import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useEffect, useState } from "react";
import Container from "@/components/global/Container";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EmptyState from "@/components/global/EmptyState";
import { ClipboardList, ArrowLeft, CreditCard, RefreshCw } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { fetchCustomerInvoiceDetail } from "@/api/invoices";
import { customFetch } from "@/utils/customAxios";
import AuthRequiredModal from "@/components/global/AuthRequiredModal";
import { toast } from "sonner";

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

// Thông tin ngân hàng cho QR code
const BANK_CONFIG = {
  BANK_ID: "MB",
  ACCOUNT_NO: "motormate",
  ACCOUNT_NAME: "NGUYEN TUONG HUY",
};

console.log(BANK_CONFIG);

// Tạo URL QR code từ VietQR
const generateQRCodeUrl = (amount, invoiceNumber) => {
  const { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME } = BANK_CONFIG;
  // Format amount: chuyển sang số nguyên (loại bỏ phần thập phân nếu có)
  const amountValue = Math.round(Number(amount)).toString();

  // Encode các tham số để đảm bảo URL hợp lệ
  const params = new URLSearchParams({
    amount: amountValue,
    addInfo: invoiceNumber || "",
    accountName: ACCOUNT_NAME,
  });

  // Format URL: nếu không có template thì dùng format compact hoặc để trống
  // Thử format: BANK_ID-ACCOUNT_NO-compact.png hoặc BANK_ID-ACCOUNT_NO.png
  const url = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?${params.toString()}`;

  // Log để debug (có thể xóa sau)
  console.log("QR Code URL:", url);
  console.log("Amount:", amountValue, "Invoice:", invoiceNumber);

  return url;
};

// Google Apps Script URL để fetch dữ liệu thanh toán
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

// Kiểm tra thanh toán từ Google Sheet
const checkPaid = async (price, content) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return false;
    }

    const lastPaid = data.data[data.data.length - 1];
    const lastPrice = parseFloat(lastPaid["Giá trị"]) || 0;
    const lastContent = lastPaid["Mô tả"] || "";

    if (lastPrice >= price && lastContent.includes(content)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Lỗi khi kiểm tra thanh toán:", error);
    return false;
  }
};

const CustomerInvoiceDetail = () => {
  const { invoice, requiresAuth, error } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [authModalVisible, setAuthModalVisible] = useState(requiresAuth);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [qrCodeError, setQrCodeError] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    setAuthModalVisible(requiresAuth);
  }, [requiresAuth]);

  useEffect(() => {
    // Reset QR code error khi mở modal
    if (paymentModalOpen) {
      setQrCodeError(false);
    }
  }, [paymentModalOpen]);

  // Function để kiểm tra và cập nhật trạng thái thanh toán
  const handleCheckPayment = async () => {
    if (!invoice || invoice.status === "paid") {
      return;
    }

    setIsCheckingPayment(true);
    try {
      const invoiceNumber = invoice.invoiceNumber || invoice.id;
      const isPaid = await checkPaid(invoice.totalAmount, invoiceNumber);

      if (isPaid) {
        // Gọi API để cập nhật trạng thái hóa đơn
        try {
          const response = await customFetch(
            `/invoices/${invoice.id}/verify-payment`,
            {
              method: "POST",
            }
          );

          if (response.data) {
            toast.success("Thanh toán thành công!");
            revalidator.revalidate();
            setPaymentModalOpen(false);
          } else {
            toast.error(
              "Đã xác nhận thanh toán nhưng không thể cập nhật trạng thái."
            );
          }
        } catch (apiError) {
          console.error("Lỗi khi cập nhật trạng thái:", apiError);
          toast.success(
            "Thanh toán thành công! Trạng thái sẽ được cập nhật sớm."
          );
        }
      } else {
        toast.info("Chưa phát hiện thanh toán. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra thanh toán:", error);
      toast.error("Không thể kiểm tra thanh toán. Vui lòng thử lại sau.");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Auto-polling khi modal mở và hóa đơn chưa thanh toán
  useEffect(() => {
    if (!paymentModalOpen || !invoice || invoice.status === "paid") {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      const invoiceNumber = invoice.invoiceNumber || invoice.id;
      const isPaid = await checkPaid(invoice.totalAmount, invoiceNumber);

      if (isPaid) {
        clearInterval(interval);
        setIsPolling(false);
        try {
          const response = await customFetch(
            `/invoices/${invoice.id}/verify-payment`,
            {
              method: "POST",
            }
          );

          if (response.data) {
            toast.success("Thanh toán thành công!");
            revalidator.revalidate();
            setPaymentModalOpen(false);
          }
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
        }
      }
    }, 5000); // Check mỗi 5 giây

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [paymentModalOpen, invoice, revalidator]);

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
            Xem chi tiết các hạng mục, chi phí và trạng thái thanh toán cho lần
            sửa chữa của bạn.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto"
        >
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
                    {invoice.invoiceNumber || invoice.id}
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
                    <div className="font-medium text-foreground font-mono">
                      {invoice.serviceOrderNumber ||
                        invoice.serviceOrderId ||
                        "—"}
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
                    <div className="text-muted-foreground">
                      Trạng thái thanh toán
                    </div>
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
                      <div className="text-muted-foreground">
                        Thời gian xác nhận
                      </div>
                      <div className="font-medium text-foreground">
                        {formatDateTime(invoice.confirmedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm border border-border/60">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold uppercase tracking-wide">
                    Báo giá đã duyệt
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Danh sách các hạng mục dịch vụ và phụ tùng đã được thực hiện
                    cho xe của bạn.
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
                  <div className="flex justify-between text-base font-semibold border-t pt-3 mt-2">
                    <span>Tổng cộng</span>
                    <span className="text-lg">
                      {formatPrice(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
                {invoice.status === "unpaid" && (
                  <Button
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Thanh toán
                  </Button>
                )}
                {invoice.status === "paid" && (
                  <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                    <div className="font-medium mb-1">Đã thanh toán</div>
                    <div className="text-muted-foreground">
                      Hóa đơn đã được thanh toán thành công.
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  Nếu bạn cần hỗ trợ thêm về hóa đơn, vui lòng liên hệ đội ngũ
                  chăm sóc khách hàng của Motormate.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal thanh toán */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Thanh toán hóa đơn
            </DialogTitle>
            <DialogDescription>
              Mã hóa đơn:{" "}
              <span className="font-mono font-medium">
                {invoice?.invoiceNumber || invoice?.id}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tổng tiền cần thanh toán:
                </span>
                <span className="text-lg font-semibold">
                  {invoice ? formatPrice(invoice.totalAmount) : "—"}
                </span>
              </div>
            </div>
            {invoice && (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="rounded-lg border-2 border-border bg-white p-4 min-h-[250px] flex items-center justify-center">
                  {!qrCodeError ? (
                    <img
                      src={generateQRCodeUrl(
                        invoice.totalAmount,
                        invoice.invoiceNumber || invoice.id
                      )}
                      alt="QR Code thanh toán"
                      className="w-full max-w-[250px] h-auto"
                      onError={(e) => {
                        console.error("QR Code load error:", e);
                        console.error("Failed URL:", e.target.src);
                        setQrCodeError(true);
                      }}
                      onLoad={() => {
                        console.log("QR Code loaded successfully");
                      }}
                    />
                  ) : (
                    <div className="text-center space-y-2 text-muted-foreground py-8">
                      <CreditCard className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm font-medium">
                        Không thể tải QR Code
                      </p>
                      <p className="text-xs">
                        Vui lòng kiểm tra lại thông tin tài khoản hoặc thử lại
                        sau.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Mã hóa đơn: {invoice.invoiceNumber || invoice.id}
                      </p>
                    </div>
                  )}
                </div>
                {!qrCodeError && (
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Quét mã QR để thanh toán qua ứng dụng ngân hàng
                  </p>
                )}
              </div>
            )}
            {invoice && invoice.status === "unpaid" && (
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  {isPolling && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>
                    {isPolling
                      ? "Đang tự động kiểm tra thanh toán..."
                      : "Hệ thống sẽ tự động kiểm tra thanh toán mỗi 5 giây"}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              {invoice && invoice.status === "unpaid" && (
                <Button
                  onClick={handleCheckPayment}
                  className="flex-1"
                  disabled={isCheckingPayment || isPolling}
                >
                  {isCheckingPayment ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Kiểm tra thanh toán
                    </>
                  )}
                </Button>
              )}
              {invoice && invoice.status === "paid" && (
                <Button className="flex-1" disabled>
                  Đã thanh toán
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

CustomerInvoiceDetail.loader = loader;

export default CustomerInvoiceDetail;
