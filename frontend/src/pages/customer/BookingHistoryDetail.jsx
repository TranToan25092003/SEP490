import { Suspense, useState, useMemo } from "react";
import { Await, useLoaderData } from "react-router-dom";
import {
  Calendar,
  Car,
  Clock,
  Package,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { getBookingById } from "@/api/bookings";
import { getServiceOrderById } from "@/api/serviceOrders";
import { formatPrice } from "@/lib/utils";
import BackButton from "@/components/global/BackButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (start, end) => {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getHours().toString().padStart(2, "0")}:${s
    .getMinutes()
    .toString()
    .padStart(2, "0")} - ${e.getHours().toString().padStart(2, "0")}:${e
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

function loader({ params }) {
  return {
    dataPromise: getBookingById(params.id).then(async (booking) => {
      let serviceOrder = null;
      if (booking.serviceOrderId) {
        try {
          serviceOrder = await getServiceOrderById(booking.serviceOrderId);
        } catch (error) {
          console.error("Failed to fetch service order:", error);
        }
      }
      return { booking, serviceOrder };
    }),
  };
}

const BookingHistoryDetailContent = ({ data }) => {
  const { booking, serviceOrder } = data;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Gộp dịch vụ và phụ tùng vào 1 mảng, thêm loại
  const allItems = useMemo(() => {
    const services =
      serviceOrder?.items?.filter((item) => item.type === "service") || [];
    const parts =
      serviceOrder?.items?.filter((item) => item.type === "part") || [];

    return [
      ...services.map((item) => ({ ...item, category: "Dịch vụ" })),
      ...parts.map((item) => ({ ...item, category: "Phụ tùng" })),
    ];
  }, [serviceOrder]);

  // Tính toán phân trang
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = allItems.slice(startIndex, endIndex);

  // Tính tổng tiền
  const totalServices = useMemo(() => {
    const services =
      serviceOrder?.items?.filter((item) => item.type === "service") || [];
    return services.reduce(
      (sum, s) => sum + (s.price || 0) * (s.quantity || 1),
      0
    );
  }, [serviceOrder]);

  const totalParts = useMemo(() => {
    const parts =
      serviceOrder?.items?.filter((item) => item.type === "part") || [];
    return parts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
      0
    );
  }, [serviceOrder]);

  const grandTotal = totalServices + totalParts;

  return (
    <Container className="space-y-6 my-8">
      <BackButton to="/profile?tab=history" label="Quay lại lịch sử sửa xe" />
      <H3>Chi Tiết Lịch Sử Sửa Xe</H3>

      {/* Thông tin đơn hàng */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Thông Tin Đơn Hàng</span>
            <Badge variant="outline">
              {translateBookingStatus(booking.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Car className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Phương tiện</p>
              <p className="font-semibold">
                {booking.vehicle?.brand || "N/A"} {booking.vehicle?.model || ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Biển số: {booking.vehicle?.licensePlate || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Năm: {booking.vehicle?.year || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Ngày hẹn</p>
              <p className="font-semibold">
                {formatDate(booking.slotStartTime)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Khung giờ</p>
              <p className="font-semibold">
                {formatTime(booking.slotStartTime, booking.slotEndTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout 2 cột: Bảng bên trái, Tổng tiền bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bảng dịch vụ và phụ tùng - Chiếm 2 cột */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Dịch Vụ & Phụ Tùng Đã Sử Dụng
              {allItems.length > 0 && (
                <span className="text-muted-foreground font-normal text-sm">
                  ({allItems.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">
                  Không có dịch vụ hoặc phụ tùng nào
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.category === "Dịch vụ"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity || 1}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(
                            (item.price || 0) * (item.quantity || 1)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Hiển thị {startIndex + 1} -{" "}
                      {Math.min(endIndex, allItems.length)} trong tổng số{" "}
                      {allItems.length} mục
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tổng tiền - Chiếm 1 cột */}
        {serviceOrder && allItems.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Tổng Kết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tổng tiền dịch vụ:
                    </span>
                    <span className="font-semibold">
                      {formatPrice(totalServices)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tổng tiền phụ tùng:
                    </span>
                    <span className="font-semibold">
                      {formatPrice(totalParts)}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
};

const BookingHistoryDetail = () => {
  const { dataPromise } = useLoaderData();

  return (
    <Suspense
      fallback={
        <Container className="flex justify-center items-center py-12">
          <Spinner className="h-8 w-8" />
        </Container>
      }
    >
      <Await
        resolve={dataPromise}
        errorElement={
          <Container>
            <div className="text-center py-8 text-destructive">
              Không thể tải thông tin lịch sử sửa xe
            </div>
          </Container>
        }
      >
        {(data) => <BookingHistoryDetailContent data={data} />}
      </Await>
    </Suspense>
  );
};

BookingHistoryDetail.loader = loader;
export default BookingHistoryDetail;
