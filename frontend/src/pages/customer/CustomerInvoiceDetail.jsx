import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/global/Container";
import background from "@/assets/cool-motorcycle-indoors.png";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/global/EmptyState";
import {
  ClipboardList,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { fetchCustomerInvoiceDetail } from "@/api/invoices";
import { getPointBalance } from "@/api/loyalty";
import { customFetch } from "@/utils/customAxios";
import AuthRequiredModal from "@/components/global/AuthRequiredModal";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";

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
  if (method === "cash") return "Tiền mặt";
  if (method === "qr_code") return "Quét QR";
  if (method === "bank_transfer") return "Chuyển khoản";
  return "Chưa xác định";
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

const normalizeOwnedVoucher = (voucher) => {
  if (!voucher) return null;

  return {
    id: voucher.id || voucher._id || voucher.voucherCode,
    code: voucher.code || voucher.voucherCode || "",
    rewardName:
      voucher.rewardName || voucher.reward?.title || voucher.title || "Voucher",
    status: voucher.status || "active",
    value: Number(voucher.value ?? voucher.voucherValue ?? 0) || 0,
    currency: voucher.currency || voucher.voucherCurrency || "VND",
    discountType: voucher.discountType || "fixed",
    expiresAt: voucher.expiresAt || voucher.voucherExpiresAt || null,
  };
};

const isVoucherUsable = (voucher) => {
  if (!voucher) return false;
  if (voucher.status !== "active") return false;
  if (!voucher.expiresAt) return true;
  return new Date(voucher.expiresAt) >= new Date();
};

const calculateVoucherDiscount = (voucher, baseAmount) => {
  if (!voucher || !baseAmount || baseAmount <= 0) return 0;
  const amount = Number(baseAmount) || 0;
  if (voucher.discountType === "percentage") {
    const percentage = Math.min(Math.max(Number(voucher.value) || 0, 0), 100);
    return Math.min(Math.round((amount * percentage) / 100), amount);
  }

  const fixedValue = Math.max(Number(voucher.value) || 0, 0);
  return Math.min(fixedValue, amount);
};

const formatVoucherValue = (voucher) => {
  if (!voucher) return "";
  if (voucher.discountType === "percentage") {
    return `${voucher.value || 0}%`;
  }
  return formatPrice(voucher.value || 0);
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
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherCode) return null;
    return (
      availableVouchers.find(
        (voucher) => voucher.code === selectedVoucherCode
      ) || null
    );
  }, [availableVouchers, selectedVoucherCode]);

  const voucherDiscount = useMemo(() => {
    if (!invoice || !selectedVoucher) return 0;
    return calculateVoucherDiscount(selectedVoucher, invoice.totalAmount);
  }, [invoice, selectedVoucher]);

  const payableAmount = useMemo(() => {
    if (!invoice) return 0;
    const total = Number(invoice.totalAmount) || 0;
    return Math.max(total - voucherDiscount, 0);
  }, [invoice, voucherDiscount]);

  useEffect(() => {
    setAuthModalVisible(requiresAuth);
  }, [requiresAuth]);

  useEffect(() => {
    // Reset QR code error khi mở modal
    if (paymentModalOpen) {
      setQrCodeError(false);
    }
  }, [paymentModalOpen]);
  useEffect(() => {
    if (!paymentModalOpen || !invoice || invoice.status === "paid") {
      return;
    }

    let ignore = false;
    const fetchVouchers = async () => {
      try {
        setVoucherLoading(true);
        setVoucherError(null);
        const response = await getPointBalance();
        if (ignore) return;
        const payload = response?.data?.data || {};
        const normalized = Array.isArray(payload.vouchers)
          ? payload.vouchers.map(normalizeOwnedVoucher).filter(Boolean)
          : [];
        const usable = normalized.filter(isVoucherUsable);
        setAvailableVouchers(usable);
        setSelectedVoucherCode((currentCode) => {
          if (!currentCode) return currentCode;
          const stillExists = usable.some(
            (voucher) => voucher.code === currentCode
          );
          return stillExists ? currentCode : "";
        });
      } catch (fetchError) {
        if (ignore) return;
        console.error("Failed to load vouchers", fetchError);
        setVoucherError(
          "KhA'ng t���i �`�����c voucher. Vui lA�ng th��- l���i sau."
        );
        setAvailableVouchers([]);
        setSelectedVoucherCode("");
      } finally {
        if (!ignore) {
          setVoucherLoading(false);
        }
      }
    };

    fetchVouchers();

    return () => {
      ignore = true;
    };
  }, [paymentModalOpen, invoice]);
  useEffect(() => {
    if (invoice?.status === "paid" && selectedVoucherCode) {
      setSelectedVoucherCode("");
    }
  }, [invoice?.status, selectedVoucherCode]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!invoice) {
      toast.error("Không có dữ liệu hóa đơn để tải xuống");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Prepare invoice data with voucher info if available
      const invoiceDataForPDF = {
        ...invoice,
        voucherDiscount: voucherDiscount > 0 ? voucherDiscount : 0,
        payableAmount: payableAmount,
        selectedVoucher: selectedVoucher || null,
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
      toast.error("Không thể tạo file PDF. Vui lòng thử lại sau.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Function để kiểm tra và cập nhật trạng thái thanh toán
  const handleCheckPayment = async () => {
    if (!invoice || invoice.status === "paid") {
      return;
    }

    // Dừng auto-polling khi user click manually
    setIsPolling(false);
    setIsCheckingPayment(true);

    try {
      const invoiceNumber = invoice.invoiceNumber || invoice.id;
      const amountToVerify = Math.max(payableAmount || 0, 0);
      const isPaid = await checkPaid(amountToVerify, invoiceNumber);

      if (isPaid) {
        // Gọi API để cập nhật trạng thái hóa đơn
        try {
          const verifyPayload = {
            paidAmount: payableAmount,
          };
          if (selectedVoucher) {
            verifyPayload.voucherCode = selectedVoucher.code;
            verifyPayload.voucherDiscount = voucherDiscount;
            verifyPayload.voucherType = selectedVoucher.discountType;
            verifyPayload.voucherValue = selectedVoucher.value;
          }

          const response = await customFetch(
            `/invoices/${invoice.id}/verify-payment`,
            {
              method: "POST",
              data: verifyPayload,
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

  // Function để fake thanh toán (dev mode)
  const handleFakePayment = async () => {
    if (!invoice || invoice.status === "paid") {
      return;
    }

    // Dừng auto-polling khi user click manually
    setIsPolling(false);
    setIsCheckingPayment(true);

    try {
      const verifyPayload = { paidAmount: payableAmount };
      if (selectedVoucher) {
        verifyPayload.voucherCode = selectedVoucher.code;
        verifyPayload.voucherDiscount = voucherDiscount;
        verifyPayload.voucherType = selectedVoucher.discountType;
        verifyPayload.voucherValue = selectedVoucher.value;
      }

      const response = await customFetch(
        `/invoices/${invoice.id}/verify-payment`,
        {
          method: "POST",
          data: verifyPayload,
        }
      );

      if (response.data) {
        toast.success("✅ [TEST] Đã fake thanh toán thành công!");
        revalidator.revalidate();
        setPaymentModalOpen(false);
      } else {
        console.log(response);
        toast.error("Không thể fake thanh toán. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi fake thanh toán:", error);
      toast.error("Không thể fake thanh toán. Vui lòng thử lại.");
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
        <div
          className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${background})`,
            backgroundPosition: "65% 35%",
          }}
        >
          <Container className="py-16 w-full max-w-7xl">
            <div className="max-w-xl mx-auto text-center space-y-4 bg-white rounded-lg p-6 shadow-lg">
              <h1 className="text-3xl font-semibold text-gray-900">
                Vui lòng đăng nhập
              </h1>
              <p className="text-gray-700">
                Bạn cần đăng nhập để xem chi tiết hóa đơn của mình.
              </p>
            </div>
          </Container>
        </div>
      </>
    );
  }

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      {/* Loading Overlay khi đang tạo PDF */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Đang tạo hóa đơn PDF...
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          </div>
        </div>
      )}
      <Container className="py-12 w-full max-w-7xl">
        {/* Header với nút quay lại và tải PDF */}
        <div className="bg-white rounded-t-lg shadow-lg mb-0">
          {/* Nút quay lại ở trên cùng */}
          <div className="p-4 border-b border-gray-200">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>
          {/* Title và nút PDF ở dòng dưới */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-2">
                Thông tin hóa đơn
              </h1>
              <p className="text-gray-700">
                Xem chi tiết các hạng mục, chi phí và trạng thái thanh toán cho
                lần sửa chữa của bạn.
              </p>
            </div>
            {invoice && (
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                <Download className="mr-2 h-4 w-4" />
                {isGeneratingPDF ? "Đang tạo PDF..." : "Tải hóa đơn PDF"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm mt-0">
            {error}
          </div>
        )}

        {!invoice && !error ? (
          <div className="bg-white rounded-lg shadow-lg mt-0">
            <EmptyState
              icon={ClipboardList}
              title="Không tìm thấy hóa đơn"
              subtitle="Hãy kiểm tra lại mã hóa đơn hoặc liên hệ với chúng tôi để được hỗ trợ."
            />
          </div>
        ) : null}

        {invoice && (
          <div className="mt-0">
            <Card className="shadow-sm border border-border/60 rounded-none border-t-0">
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
                      <div className="text-muted-foreground">
                        Tên khách hàng
                      </div>
                      <div className="font-medium text-foreground">
                        {invoice.customerName || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Phương Thức Thanh Toán
                      </div>
                      <div className="font-medium text-foreground">
                        {renderPaymentMethod(invoice.paymentMethod)}
                      </div>
                    </div>
                    {invoice.confirmedBy && (
                      <div>
                        <div className="text-muted-foreground">
                          Xác nhận bởi
                        </div>
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

            <div className="grid gap-0 lg:grid-cols-2">
              <Card className="shadow-sm border border-border/60 rounded-none border-t-0 border-r-0 lg:border-r-0 rounded-bl-lg">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold uppercase tracking-wide">
                      Báo giá đã duyệt
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Danh sách các hạng mục dịch vụ và phụ tùng đã được thực
                      hiện cho xe của bạn.
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
                          <TableHead className="text-right">
                            Thành tiền
                          </TableHead>
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

              <Card className="border border-border/60 rounded-none border-t-0 border-l-0 rounded-br-lg shadow-none">
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
                    {voucherDiscount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-emerald-600 border-t pt-2 mt-2">
                          <span>Giảm giá bằng voucher</span>
                          <span>-{formatPrice(voucherDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-emerald-700 border-t pt-2 mt-2">
                          <span>Số tiền còn lại cần thanh toán</span>
                          <span className="text-lg">
                            {formatPrice(payableAmount)}
                          </span>
                        </div>
                      </>
                    )}
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
                    Bạn có thể thanh toán online hoặc trực tiếp thanh toán tại
                    quầy
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modal thanh toán */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Tổng tiền cần thanh toán:
                  </span>
                  <span className="text-lg font-semibold">
                    {invoice ? formatPrice(invoice.totalAmount) : "—"}
                  </span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 mt-2">
                    <span>Giảm voucher</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                  <span>Số tiền cần thanh toán</span>
                  <span className="text-lg">
                    {invoice ? formatPrice(payableAmount) : "—"}
                  </span>
                </div>
              </div>
              {invoice?.status === "unpaid" && (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Sử dụng voucher</p>
                      <p className="text-xs text-muted-foreground">
                        Chọn voucher để giảm số tiền chuyển khoản.
                      </p>
                    </div>
                    {selectedVoucherCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVoucherCode("")}
                      >
                        Bỏ chọn
                      </Button>
                    )}
                  </div>
                  <Select
                    value={selectedVoucherCode || undefined}
                    onValueChange={setSelectedVoucherCode}
                    disabled={voucherLoading || availableVouchers.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          voucherLoading
                            ? "Đang tải voucher..."
                            : availableVouchers.length === 0
                            ? "Chưa có voucher khả dụng"
                            : "Chọn voucher"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVouchers.map((voucher) => (
                        <SelectItem key={voucher.code} value={voucher.code}>
                          {voucher.rewardName} ({formatVoucherValue(voucher)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {voucherError && (
                    <p className="text-xs text-destructive">{voucherError}</p>
                  )}
                  {voucherLoading && !voucherError && (
                    <p className="text-xs text-muted-foreground">
                      Đang tải danh sách voucher...
                    </p>
                  )}
                  {!voucherLoading &&
                    availableVouchers.length === 0 &&
                    !voucherError && (
                      <p className="text-xs text-muted-foreground">
                        Bạn chưa có voucher khả dụng.
                      </p>
                    )}
                  {selectedVoucher && (
                    <div className="rounded-md border bg-background/70 p-3 text-xs space-y-1">
                      <p className="font-medium">
                        {selectedVoucher.rewardName}
                      </p>
                      <p>Giá trị: {formatVoucherValue(selectedVoucher)}</p>
                      <p>
                        Mã:{" "}
                        <span className="font-mono">
                          {selectedVoucher.code}
                        </span>
                      </p>
                      {selectedVoucher.expiresAt && (
                        <p>
                          Hạn sử dụng:{" "}
                          {formatDateTime(selectedVoucher.expiresAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {invoice && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-lg border-2 border-border bg-white p-4 w-full max-w-[280px] min-h-[250px] flex items-center justify-center">
                    {!qrCodeError ? (
                      <img
                        src={generateQRCodeUrl(
                          payableAmount,
                          invoice.invoiceNumber || invoice.id
                        )}
                        alt="QR Code thanh toán"
                        className="w-full h-auto max-w-full"
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
                    <p className="text-xs text-muted-foreground text-center px-4">
                      Quét mã QR để thanh toán qua ứng dụng ngân hàng
                    </p>
                  )}
                </div>
              )}
              {invoice && invoice.status === "unpaid" && (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    {isPolling && (
                      <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                    )}
                    <span className="break-words">
                      {isPolling
                        ? "Đang tự động kiểm tra thanh toán..."
                        : "Hệ thống sẽ tự động kiểm tra thanh toán mỗi 5 giây"}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPolling(false);
                    setPaymentModalOpen(false);
                  }}
                  className="w-full sm:flex-1 order-3 sm:order-1"
                >
                  Hủy
                </Button>
                {invoice && invoice.status === "unpaid" && (
                  <>
                    <Button
                      onClick={handleCheckPayment}
                      className="w-full sm:flex-1 order-1 sm:order-2"
                      disabled={isCheckingPayment}
                    >
                      {isCheckingPayment ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">
                            Đang kiểm tra...
                          </span>
                          <span className="sm:hidden">Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">
                            Kiểm tra thanh toán
                          </span>
                          <span className="sm:hidden">Kiểm tra</span>
                        </>
                      )}
                    </Button>
                    {/* DEV MODE: Button để fake thanh toán cho testing */}
                    {(import.meta.env.DEV ||
                      import.meta.env.VITE_ENABLE_TEST_PAYMENT === "true") && (
                      <Button
                        onClick={handleFakePayment}
                        className="w-full sm:flex-1 bg-yellow-600 hover:bg-yellow-700 text-white order-2 sm:order-3"
                        disabled={isCheckingPayment}
                        title="DEV MODE: Fake thanh toán để test tích điểm"
                      >
                        {isCheckingPayment ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">
                              Đang xử lý...
                            </span>
                            <span className="sm:hidden">Đang xử lý...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">
                              🧪 Fake Thanh Toán
                            </span>
                            <span className="sm:hidden">🧪 Fake</span>
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
                {invoice && invoice.status === "paid" && (
                  <Button className="w-full sm:flex-1" disabled>
                    Đã thanh toán
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
};

CustomerInvoiceDetail.loader = loader;

export default CustomerInvoiceDetail;
