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
import {
  fetchCustomerInvoiceDetail,
  getSepayTransactions,
} from "@/api/invoices";
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
  BANK_ID: "TPB",
  ACCOUNT_NO: "00000111924",
  ACCOUNT_NAME: "NGUYEN TUONG HUY",
};

// console.log(BANK_CONFIG);

// Tạo URL QR code từ VietQR
const generateQRCodeUrl = (amount, invoiceNumber) => {
  const { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME } = BANK_CONFIG;

  const amountValue = Math.round(Number(amount)).toString();

  const params = new URLSearchParams({
    amount: amountValue,
    addInfo: invoiceNumber || "",
    accountName: ACCOUNT_NAME,
  });

  const url = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?${params.toString()}`;

  // console.log("QR Code URL:", url);
  // console.log("Amount:", amountValue, "Invoice:", invoiceNumber);

  return url;
};

// Kiểm tra thanh toán từ Sepay webhook
const checkPaid = async (amount, invoiceNumber) => {
  try {
    // Lấy 20 giao dịch gần nhất
    const transactionsData = await getSepayTransactions(20);

    // Xử lý nhiều cấu trúc response khác nhau
    let transactions = [];
    if (transactionsData?.data?.transactions) {
      transactions = transactionsData.data.transactions;
    } else if (transactionsData?.data?.data?.transactions) {
      transactions = transactionsData.data.data.transactions;
    } else if (Array.isArray(transactionsData?.data)) {
      transactions = transactionsData.data;
    } else if (Array.isArray(transactionsData?.transactions)) {
      transactions = transactionsData.transactions;
    }

    if (!transactions || transactions.length === 0) {
      return false;
    }

    // Chuẩn hóa invoice number để so sánh
    const normalizedInvoiceNumber = invoiceNumber
      ? invoiceNumber.toString().trim().toUpperCase()
      : "";
    const invoiceNumberOnly = normalizedInvoiceNumber.replace(/\D/g, ""); // Chỉ số
    const invoiceNumberAlphanumeric = normalizedInvoiceNumber.replace(
      /[^A-Z0-9]/g,
      ""
    ); // Chữ và số

    // Tìm giao dịch khớp với invoice number và amount
    for (const transaction of transactions) {
      // Lấy số tiền vào (amount_in) - đây là số tiền nhận được từ Sepay
      const transactionAmountIn = parseFloat(transaction.amount_in || 0);

      // Lấy nội dung chuyển khoản (transaction_content) - đây là nội dung từ Sepay
      const transactionContent =
        transaction.transaction_content || transaction.content || "";

      // Kiểm tra số tiền vào khớp với số tiền cần thanh toán (cho phép sai số 1000 VND)
      const amountMatch = Math.abs(transactionAmountIn - amount) < 1000;

      if (!amountMatch) {
        continue; // Bỏ qua nếu số tiền không khớp
      }

      // Chuẩn hóa nội dung chuyển khoản để so sánh
      const normalizedContent = transactionContent
        .toString()
        .trim()
        .toUpperCase();

      // Kiểm tra nội dung chuyển khoản có khớp với invoice number không
      const contentMatch =
        normalizedContent === normalizedInvoiceNumber || // Khớp chính xác
        normalizedContent === invoiceNumberOnly || // Khớp chỉ số
        normalizedContent === invoiceNumberAlphanumeric || // Khớp chữ và số
        normalizedContent.includes(normalizedInvoiceNumber) || // Chứa invoice number đầy đủ
        (invoiceNumberOnly && normalizedContent.includes(invoiceNumberOnly)) || // Chứa chỉ số
        (invoiceNumberAlphanumeric &&
          normalizedContent.includes(invoiceNumberAlphanumeric)); // Chứa chữ và số

      if (!contentMatch) {
        continue; // Bỏ qua nếu nội dung không khớp
      }

      // Nếu số tiền vào khớp và nội dung chuyển khoản khớp → thanh toán thành công
      if (amountMatch && contentMatch) {
        console.log(
          "✅ Tìm thấy giao dịch khớp - Tự động xác nhận thanh toán:",
          {
            transactionId: transaction.id,
            transactionAmountIn,
            transactionContent: normalizedContent,
            invoiceNumber: normalizedInvoiceNumber,
            amount,
            transactionDate: transaction.transaction_date,
          }
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Lỗi khi kiểm tra thanh toán từ Sepay:", error);
    return false;
  }
};

const normalizeOwnedVoucher = (voucher) => {
  if (!voucher) return null;

  // Đảm bảo có code (bắt buộc để hiển thị)
  const code = voucher.code || voucher.voucherCode || "";
  if (!code) {
    console.warn("[normalizeOwnedVoucher] Voucher missing code:", voucher);
    return null;
  }

  return {
    id: voucher.id || voucher._id || voucher.voucherCode || code,
    code: code,
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
  if (!voucher) {
    console.warn("[isVoucherUsable] Voucher is null/undefined");
    return false;
  }

  // Kiểm tra code (bắt buộc)
  if (!voucher.code) {
    console.warn("[isVoucherUsable] Voucher missing code:", voucher);
    return false;
  }

  // Kiểm tra status
  if (voucher.status !== "active") {
    console.log(
      "[isVoucherUsable] Voucher not active:",
      voucher.code,
      "status:",
      voucher.status
    );
    return false;
  }

  // Kiểm tra hết hạn
  if (voucher.expiresAt) {
    const expiresDate = new Date(voucher.expiresAt);
    const now = new Date();
    if (expiresDate < now) {
      console.log(
        "[isVoucherUsable] Voucher expired:",
        voucher.code,
        "expiresAt:",
        voucher.expiresAt
      );
      return false;
    }
  }

  return true;
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

  // Số tiền giảm bởi voucher đang chọn (trước thuế)
  const voucherDiscount = useMemo(() => {
    if (!invoice || !selectedVoucher) return 0;
    // Áp dụng voucher trên subtotal (tổng tiền hàng & dịch vụ chưa thuế)
    const baseAmount = Number(invoice.subtotal) || 0;
    return calculateVoucherDiscount(selectedVoucher, baseAmount);
  }, [invoice, selectedVoucher]);

  // Discount đã áp dụng thực tế trên hóa đơn (nếu đã thanh toán)
  const appliedInvoiceDiscount = Number(invoice?.discountAmount || 0);

  // Tổng giảm giá được xem là đang áp dụng:
  // - Nếu hóa đơn đã thanh toán: ưu tiên discount trên invoice (đã chốt)
  // - Nếu chưa thanh toán: dùng voucher đang chọn trên UI
  const effectiveDiscount = useMemo(() => {
    if (!invoice) return 0;
    if (invoice.status === "paid") {
      return appliedInvoiceDiscount;
    }
    return voucherDiscount;
  }, [invoice, appliedInvoiceDiscount, voucherDiscount]);

  // Giá trị gốc chưa thuế
  const subtotal = Number(invoice?.subtotal || 0);

  // Giá trị tính thuế = Subtotal - Voucher
  const taxableAmount = useMemo(() => {
    return Math.max(subtotal - (effectiveDiscount || 0), 0);
  }, [subtotal, effectiveDiscount]);

  // Thuế VAT 10% tính trên giá trị sau khi trừ voucher
  const vatAmount = useMemo(() => {
    // Nếu backend đã có tax, nhưng để minh bạch theo chuẩn: tính lại trên taxableAmount
    const computedVat = Math.round(taxableAmount * 0.1);
    return computedVat;
  }, [taxableAmount]);

  // Tổng thanh toán cuối cùng = Giá trị tính thuế + VAT
  const finalPayableAmount = useMemo(() => {
    return taxableAmount + vatAmount;
  }, [taxableAmount, vatAmount]);

  useEffect(() => {
    setAuthModalVisible(requiresAuth);
  }, [requiresAuth]);

  useEffect(() => {
    // Reset QR code error khi mở modal
    if (paymentModalOpen) {
      setQrCodeError(false);
    }
  }, [paymentModalOpen]);
  // Fetch vouchers ngay khi component mount hoặc khi invoice status là unpaid
  // Không cần đợi mở payment modal vì UI hiển thị voucher ở ngoài modal
  useEffect(() => {
    if (!invoice || invoice.status === "paid") {
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

        // Debug log để kiểm tra
        console.log("[CustomerInvoiceDetail] Vouchers payload:", {
          hasVouchers: !!payload.vouchers,
          vouchersType: Array.isArray(payload.vouchers)
            ? "array"
            : typeof payload.vouchers,
          vouchersLength: Array.isArray(payload.vouchers)
            ? payload.vouchers.length
            : 0,
          rawVouchers: payload.vouchers,
        });

        const normalized = Array.isArray(payload.vouchers)
          ? payload.vouchers.map(normalizeOwnedVoucher).filter(Boolean)
          : [];

        console.log("[CustomerInvoiceDetail] Normalized vouchers:", normalized);

        const usable = normalized.filter(isVoucherUsable);

        console.log("[CustomerInvoiceDetail] Usable vouchers:", usable);

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
  }, [invoice]);
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
        voucherDiscount: effectiveDiscount > 0 ? effectiveDiscount : 0,
        payableAmount: finalPayableAmount,
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

    setIsCheckingPayment(true);

    try {
      const invoiceNumber = invoice.invoiceNumber || invoice.id;
      const amountToVerify = Math.max(finalPayableAmount || 0, 0);
      const isPaid = await checkPaid(amountToVerify, invoiceNumber);

      if (isPaid) {
        // Gọi API để cập nhật trạng thái hóa đơn
        try {
          const verifyPayload = {
            paidAmount: finalPayableAmount,
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
                        {(invoice.items ?? []).map((item, index) => {
                          const maxLength = 30;
                          const displayName =
                            item.name.length > maxLength
                              ? item.name.substring(0, maxLength) + "..."
                              : item.name;

                          return (
                            <TableRow key={`${item.name}-${index}`}>
                              <TableCell className="font-medium max-w-[200px]">
                                <span
                                  className="block truncate text-sm"
                                  title={item.name}
                                >
                                  {displayName}
                                </span>
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
                          );
                        })}
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
                    {/* 1. Tổng tiền hàng & dịch vụ (chưa thuế) */}
                    <div className="flex justify-between text-sm">
                      <span>Tổng tiền hàng &amp; dịch vụ (chưa thuế)</span>
                      <span className="font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {/* 2. Voucher giảm giá */}
                    <div className="flex justify-between text-sm">
                      <span>
                        Voucher giảm giá
                        {selectedVoucher?.code
                          ? ` (${selectedVoucher.code})`
                          : invoice?.discountCode
                          ? ` (${invoice.discountCode})`
                          : ""}
                      </span>
                      <span className="font-medium text-emerald-600">
                        {effectiveDiscount > 0
                          ? `-${formatPrice(effectiveDiscount)}`
                          : "-"}
                      </span>
                    </div>
                    {/* 3. Giá trị tính thuế */}
                    <div className="flex justify-between text-sm border-t pt-3 mt-2">
                      <span>Giá trị tính thuế</span>
                      <span className="font-medium">
                        {formatPrice(taxableAmount)}
                      </span>
                    </div>
                    {/* 4. Thuế VAT (10%) */}
                    <div className="flex justify-between text-sm">
                      <span>Thuế VAT (10%)</span>
                      <span className="font-medium">
                        {formatPrice(vatAmount)}
                      </span>
                    </div>
                    {/* 5. Tổng thanh toán cuối cùng */}
                    <div className="flex justify-between text-base font-semibold border-t pt-3 mt-2">
                      <span>Tổng thanh toán</span>
                      <span className="text-lg">
                        {formatPrice(finalPayableAmount)}
                      </span>
                    </div>
                  </div>
                  {invoice.status === "unpaid" && (
                    <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Sử dụng voucher</p>
                          <p className="text-xs text-muted-foreground">
                            Chọn voucher để giảm số tiền thanh toán trước khi mở
                            QR.
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
                        disabled={
                          voucherLoading || availableVouchers.length === 0
                        }
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
                              {voucher.rewardName} (
                              {formatVoucherValue(voucher)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {voucherError && (
                        <p className="text-xs text-destructive">
                          {voucherError}
                        </p>
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
          <DialogContent className="sm:max-w-lg sm:max-h-[90vh] sm:overflow-y-auto max-h-none overflow-visible">
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
                {/* 1. Tổng tiền hàng & dịch vụ (chưa thuế) */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tổng tiền hàng &amp; dịch vụ (chưa thuế)
                  </span>
                  <span className="text-lg font-semibold">
                    {invoice ? formatPrice(subtotal) : "—"}
                  </span>
                </div>
                {/* 2. Voucher giảm giá */}
                <div className="flex justify-between text-xs mt-2">
                  <span>Voucher giảm giá</span>
                  <span className="font-medium text-emerald-600">
                    {effectiveDiscount > 0
                      ? `-${formatPrice(effectiveDiscount)}`
                      : "-"}
                  </span>
                </div>
                {/* 3. Giá trị tính thuế */}
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span>Giá trị tính thuế</span>
                  <span className="font-semibold">
                    {invoice ? formatPrice(taxableAmount) : "—"}
                  </span>
                </div>
                {/* 4. Thuế VAT (10%) */}
                <div className="flex justify-between text-sm">
                  <span>Thuế VAT (10%)</span>
                  <span className="font-semibold">
                    {invoice ? formatPrice(vatAmount) : "—"}
                  </span>
                </div>
                {/* 5. Tổng thanh toán cuối cùng */}
                <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                  <span>Số tiền cần thanh toán</span>
                  <span className="text-lg">
                    {invoice ? formatPrice(finalPayableAmount) : "—"}
                  </span>
                </div>
              </div>
              {invoice && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-lg border-2 border-border bg-white p-4 w-full max-w-[280px] min-h-[250px] flex items-center justify-center">
                    {!qrCodeError ? (
                      <img
                        src={generateQRCodeUrl(
                          finalPayableAmount,
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
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
                    {/* Nút fake payment cho môi trường DEV đã được ẩn */}
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
