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
    if (num === 0) return "không";

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

    const readGroup = (n) => {
      if (n === 0) return "";
      let result = "";

      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;

      // Handle hundreds
      if (hundred > 0) {
        result += ones[hundred] + " trăm ";
      }

      // Handle tens and ones
      if (ten > 0) {
        if (ten === 1) {
          if (one === 0) {
            result += "mười";
          } else if (one === 5) {
            result += "mười lăm";
          } else {
            result += "mười " + ones[one];
          }
        } else {
          result += ones[ten] + " mươi ";
          if (one === 1) {
            result += "mốt";
          } else if (one === 5) {
            result += "lăm";
          } else if (one > 0) {
            result += ones[one];
          }
        }
      } else if (one > 0) {
        result += ones[one];
      }

      return result.trim();
    };

    // Handle billions (tỷ)
    if (num >= 1000000000) {
      const billion = Math.floor(num / 1000000000);
      const remainder = num % 1000000000;
      let result = readGroup(billion) + " tỷ";
      if (remainder > 0) {
        result += " " + numberToVietnameseWords(remainder);
      }
      return result;
    }

    // Handle millions (triệu)
    if (num >= 1000000) {
      const million = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      let result = readGroup(million) + " triệu";
      if (remainder > 0) {
        result += " " + numberToVietnameseWords(remainder);
      }
      return result;
    }

    // Handle thousands (nghìn)
    if (num >= 1000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = readGroup(thousand) + " nghìn";
      if (remainder > 0) {
        result += " " + readGroup(remainder);
      }
      return result;
    }

    // Handle numbers less than 1000
    return readGroup(num);
  };

  // Convert amount to Vietnamese words with đồng
  const amountToVietnameseWords = (amount) => {
    if (!amount || amount === 0) return "không đồng";

    const amountInThousands = Math.floor(amount / 1000);
    const remainder = amount % 1000;

    let result = numberToVietnameseWords(amountInThousands);
    
    if (amountInThousands > 0) {
      result += " nghìn";
    }

    if (remainder > 0) {
      result += " " + numberToVietnameseWords(remainder);
    }

    result += " đồng";

    // Add "chẵn" if there's no remainder (exact amount)
    if (remainder === 0 && amountInThousands > 0) {
      result += " chẵn";
    }

    return result;
  };

  const handleExportPDF = async () => {
    if (!receipt) return;

    setExporting(true);

    try {
      const totalAmount = receipt.totalAmount || 0;
      const pdfBlob = await generateGoodsReceiptPDF({
        ...receipt,
        items: items,
        totalAmountInWords: amountToVietnameseWords(totalAmount),
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

  if (exporting) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-primary border-r-transparent animate-spin" />
          <div className="text-gray-900 font-semibold">Đang tạo PDF...</div>
          <div className="text-gray-500 text-sm">
            Vui lòng chờ trong giây lát
          </div>
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
          <p className="text-lg capitalize">
            {amountToVietnameseWords(receipt.totalAmount)}
          </p>
        </div>
      )}
    </div>
  );
}
