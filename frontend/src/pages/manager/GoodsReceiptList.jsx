import { useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchIcon as searchSvg } from "@/assets/admin/topmenu_new";
import {
  Table,
  TableBody,
  TableCell,
  TableCellMinContent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Link } from "react-router-dom";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import { Eye, FileText } from "lucide-react";
import { generateGoodsReceiptPDF } from "@/utils/pdfGeneratorHtml";

export default function GoodsReceiptList() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [exporting, setExporting] = useState(false);

  const { receipts = [], pagination = {} } = loaderData || {};

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set("search", value);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.delete("page"); // Reset to first page
    setSearchParams(newSearchParams);
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

  // Handle export PDF
  const handleExportPDF = async (receipt) => {
    if (!receipt) return;

    setExporting(true);
    try {
      // Fetch receipt items
      const response = await customFetch(
        `/manager/goods-receipt/${receipt._id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const { items } = response.data;
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
      setExporting(false);
    }
  };

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách phiếu nhập kho</h1>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/manager/goods-receipt">+ Tạo phiếu nhập kho</Link>
          </Button>
          {/* <Button variant="outline" onClick={() => navigate("/manager/items")}>
            Quay lại
          </Button> */}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-[520px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px]">
            <img
              src={searchSvg}
              alt="search"
              className="block w-[18px] h-[18px]"
            />
          </span>
          <Input
            placeholder="Tìm kiếm theo số phiếu hoặc nhà cung cấp..."
            className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Số phiếu nhập</TableHead>
            <TableHead>Nhà cung cấp</TableHead>
            <TableHead>Ngày nhập</TableHead>
            <TableHead>Địa điểm nhập</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Không có phiếu nhập kho nào
              </TableCell>
            </TableRow>
          ) : (
            receipts.map((receipt) => (
              <TableRow key={receipt._id}>
                <TableCell>
                  <div className="font-medium text-blue-600">
                    {receipt.receiptNumber}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{receipt.supplier?.name}</div>
                    {receipt.supplier?.contact && (
                      <div className="text-sm text-gray-500">
                        {receipt.supplier.contact}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(receipt.receivedDate)}</TableCell>
                <TableCell>{receipt.warehouseLocation}</TableCell>
                <TableCell className="font-medium">
                  {formatPrice(receipt.totalAmount)}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      receipt.status
                    )}`}
                  >
                    {getStatusText(receipt.status)}
                  </span>
                </TableCell>
                <TableCellMinContent>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/manager/goods-receipt/${receipt._id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Generate and download PDF directly
                        handleExportPDF(receipt);
                      }}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCellMinContent>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && <AdminPagination pagination={pagination} />}
    </div>
  );
}
