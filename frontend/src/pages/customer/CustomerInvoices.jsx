import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Container from "@/components/global/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { fetchCustomerInvoices } from "@/api/invoices";
import AuthRequiredModal from "@/components/global/AuthRequiredModal";
import background from "@/assets/cool-motorcycle-indoors.png";
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

  // State cho filter và phân trang
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setAuthModalVisible(requiresAuth);
  }, [requiresAuth]);

  // Áp dụng filter và phân trang
  const {
    filteredInvoices,
    totalPages,
    startIndex,
    endIndex,
    currentInvoices,
  } = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        filteredInvoices: [],
        totalPages: 0,
        startIndex: 0,
        endIndex: 0,
        currentInvoices: [],
      };
    }

    // Áp dụng filter
    let filtered = invoices.filter((invoice) => {
      // Filter theo tìm kiếm
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
          invoice.id?.toLowerCase().includes(searchLower) ||
          invoice.serviceOrderNumber?.toLowerCase().includes(searchLower) ||
          invoice.serviceOrderId?.toLowerCase().includes(searchLower) ||
          invoice.licensePlate?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter theo trạng thái
      if (selectedStatus !== "all") {
        if (invoice.status !== selectedStatus) return false;
      }

      return true;
    });

    // Tính toán phân trang
    const total = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const current = filtered.slice(start, end);

    return {
      filteredInvoices: filtered,
      totalPages: total,
      startIndex: start,
      endIndex: end,
      currentInvoices: current,
    };
  }, [invoices, searchText, selectedStatus, currentPage, itemsPerPage]);

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
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <div className="w-full max-w-6xl">
        <Card className="w-full shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b">
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              Hóa đơn dịch vụ
            </h1>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
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
              <>
                {/* Thanh filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="size-5" />
                      Bộ Lọc
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tìm kiếm */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm kiếm theo mã hóa đơn, lệnh sửa chữa, biển số..."
                          value={searchText}
                          onChange={(e) => {
                            setSearchText(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-9"
                        />
                      </div>

                      {/* Lọc theo trạng thái */}
                      <Select
                        value={selectedStatus}
                        onValueChange={(value) => {
                          setSelectedStatus(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="paid">Đã thanh toán</SelectItem>
                          <SelectItem value="unpaid">
                            Chưa thanh toán
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nút xóa filter */}
                    {(searchText || selectedStatus !== "all") && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchText("");
                            setSelectedStatus("all");
                            setCurrentPage(1);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Xóa bộ lọc
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bảng hóa đơn */}
                {filteredInvoices.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Không tìm thấy kết quả
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Không có hóa đơn nào phù hợp với bộ lọc của bạn.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchText("");
                          setSelectedStatus("all");
                          setCurrentPage(1);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Xóa bộ lọc
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-border/60 shadow-sm min-h-[600px]">
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
                          {currentInvoices.map((invoice) => (
                            <TableRow
                              key={invoice.id}
                              className="hover:bg-muted/30"
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {invoice.invoiceNumber || invoice.id}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(invoice.status)}
                              </TableCell>
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
                                  <Link to={`/invoices/${invoice.id}`}>
                                    Xem chi tiết
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Thêm các dòng trống để giữ layout khi không đủ 10 hóa đơn */}
                          {currentInvoices.length < itemsPerPage &&
                            Array.from({
                              length: itemsPerPage - currentInvoices.length,
                            }).map((_, index) => (
                              <TableRow key={`empty-${index}`} className="h-16">
                                <TableCell
                                  colSpan={7}
                                  className="h-16"
                                ></TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Hiển thị {startIndex + 1} -{" "}
                          {Math.min(endIndex, filteredInvoices.length)} trong
                          tổng số {filteredInvoices.length} hóa đơn
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Trước
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Sau
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

CustomerInvoices.loader = loader;

export default CustomerInvoices;
