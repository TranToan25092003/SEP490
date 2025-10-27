import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import { generateGoodsReceiptPDF } from "@/utils/pdfGeneratorHtml";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function GoodsReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReceiptDetail();
  }, [id]);

  const fetchReceiptDetail = async () => {
    try {
      setLoading(true);
      const response = await customFetch(`/manager/goods-receipt/${id}`);

      if (response.data.success) {
        setReceipt(response.data.receipt);
        setItems(response.data.items || []);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi", {
        description: error.message || "Không thể tải thông tin phiếu nhập kho",
      });
      navigate("/manager/goods-receipt-list");
    } finally {
      setLoading(false);
    }
  };

  // Convert number to Vietnamese words
  const numberToVietnameseWords = (num) => {
    const ones = [
      "",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];
    const tens = [
      "",
      "",
      "hai mươi",
      "ba mươi",
      "bốn mươi",
      "năm mươi",
      "sáu mươi",
      "bảy mươi",
      "tám mươi",
      "chín mươi",
    ];
    const hundreds = [
      "",
      "một trăm",
      "hai trăm",
      "ba trăm",
      "bốn trăm",
      "năm trăm",
      "sáu trăm",
      "bảy trăm",
      "tám trăm",
      "chín trăm",
    ];

    if (num === 0) return "không";
    if (num < 10) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      if (one === 0) return tens[ten];
      if (ten === 1) return `mười ${ones[one]}`;
      return `${tens[ten]} ${ones[one]}`;
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      if (remainder === 0) return hundreds[hundred];
      return `${hundreds[hundred]} ${numberToVietnameseWords(remainder)}`;
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      if (remainder === 0) return `${numberToVietnameseWords(thousand)} nghìn`;
      return `${numberToVietnameseWords(
        thousand
      )} nghìn ${numberToVietnameseWords(remainder)}`;
    }
    if (num < 1000000000) {
      const million = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      if (remainder === 0) return `${numberToVietnameseWords(million)} triệu`;
      return `${numberToVietnameseWords(
        million
      )} triệu ${numberToVietnameseWords(remainder)}`;
    }
    return "số quá lớn";
  };

  const handleExportPDF = async () => {
    if (!receipt) return;

    setExporting(true);

    // Create loading overlay that covers entire page
    const overlay = document.createElement("div");
    overlay.id = "pdf-loading-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;
    overlay.innerHTML = `
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #dc2626;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
      </style>
      <div style="text-align: center;">
        <div id="spinner"></div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1f2937;">Đang tạo PDF...</div>
        <div style="color: #6b7280; font-size: 14px;">Vui lòng chờ trong giây lát</div>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      const totalAmount = receipt.totalAmount || 0;
      const pdfBlob = await generateGoodsReceiptPDF({
        ...receipt,
        items: items,
        totalAmountInWords: `${numberToVietnameseWords(
          Math.floor(totalAmount / 1000)
        )} nghìn đồng chẵn`,
      });

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `phiếu-nhập-kho-${receipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Thành công", {
        description: "PDF đã được tải xuống",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Lỗi", {
        description: "Không thể tạo PDF. Vui lòng thử lại.",
      });
    } finally {
      // Remove loading overlay
      const loadingOverlay = document.getElementById("pdf-loading-overlay");
      if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
      setExporting(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-blue-600 bg-blue-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "pending":
        return "Chờ duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Không tìm thấy phiếu nhập kho
          </h2>
          <Button onClick={() => navigate("/manager/goods-receipt-list")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/manager/goods-receipt-list")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chi tiết phiếu nhập kho</h1>
            <p className="text-gray-600">Số phiếu: {receipt.receiptNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Đang tạo PDF..." : "Xuất PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/manager/goods-receipt-list")}
          >
            Quay lại
          </Button>
        </div>
      </div>

      {/* Receipt Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thông tin nhà cung cấp</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <span className="font-medium">Tên nhà cung cấp:</span>{" "}
              {receipt.supplier?.name || "N/A"}
            </div>
            {receipt.supplier?.contact && (
              <div>
                <span className="font-medium">Người liên hệ:</span>{" "}
                {receipt.supplier.contact}
              </div>
            )}
            {receipt.supplier?.address && (
              <div>
                <span className="font-medium">Địa chỉ:</span>{" "}
                {receipt.supplier.address}
              </div>
            )}
            {receipt.supplier?.phone && (
              <div>
                <span className="font-medium">Số điện thoại:</span>{" "}
                {receipt.supplier.phone}
              </div>
            )}
            {receipt.supplier?.taxCode && (
              <div>
                <span className="font-medium">Mã số thuế:</span>{" "}
                {receipt.supplier.taxCode}
              </div>
            )}
          </div>
        </div>

        {/* Receipt Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Thông tin phiếu nhập</h2>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <span className="font-medium">Số phiếu nhập:</span>{" "}
              {receipt.receiptNumber}
            </div>
            <div>
              <span className="font-medium">Ngày nhập hàng:</span>{" "}
              {formatDate(receipt.receivedDate)}
            </div>
            <div>
              <span className="font-medium">Ngày tạo phiếu:</span>{" "}
              {formatDate(receipt.documentDate)}
            </div>
            <div>
              <span className="font-medium">Địa điểm nhập kho:</span>{" "}
              {receipt.warehouseLocation}
            </div>
            <div>
              <span className="font-medium">Trạng thái:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  receipt.status
                )}`}
              >
                {getStatusText(receipt.status)}
              </span>
            </div>
            {receipt.notes && (
              <div>
                <span className="font-medium">Ghi chú:</span> {receipt.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Mã sản phẩm</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Số lượng theo chứng từ</TableHead>
              <TableHead>Số lượng thực nhập</TableHead>
              <TableHead>Đơn giá</TableHead>
              <TableHead>Thành tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item._id || index}>
                  <TableCell>{item.sequenceNumber}</TableCell>
                  <TableCell>{item.partName}</TableCell>
                  <TableCell>{item.partCode}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.quantityOnDocument}</TableCell>
                  <TableCell>{item.quantityActuallyReceived}</TableCell>
                  <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(item.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {items.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right font-bold">
                  Tổng cộng:
                </TableCell>
                <TableCell className="font-bold">
                  {formatPrice(receipt.totalAmount)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Total Amount in Words */}
      {receipt.totalAmount && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tổng số tiền (Viết bằng chữ):</h3>
          <p className="text-lg">
            {numberToVietnameseWords(Math.floor(receipt.totalAmount / 1000))}{" "}
            nghìn đồng chẵn
          </p>
        </div>
      )}
    </div>
  );
}
