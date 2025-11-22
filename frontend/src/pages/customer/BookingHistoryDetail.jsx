import { Suspense, useState, useMemo, useEffect } from "react";
import { Await, useLoaderData, useNavigate } from "react-router-dom";
import {
  Calendar,
  Car,
  Clock,
  Package,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { getBookingById } from "@/api/bookings";
import { getServiceOrderById } from "@/api/serviceOrders";
import { checkWarrantyEligibility } from "@/api/warranty";
import { formatPrice } from "@/lib/utils";
import background from "@/assets/cool-motorcycle-indoors.png";
import { ArrowLeft } from "lucide-react";
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
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParts, setSelectedParts] = useState([]);
  const [warrantyEligibility, setWarrantyEligibility] = useState(null);
  const itemsPerPage = 5;

  // Kiểm tra điều kiện bảo hành
  useEffect(() => {
    if (serviceOrder?.id) {
      checkWarrantyEligibility(serviceOrder.id)
        .then((eligibility) => {
          setWarrantyEligibility(eligibility);
        })
        .catch((error) => {
          console.error("Failed to check warranty eligibility:", error);
          setWarrantyEligibility({ eligible: false, reason: "Không thể kiểm tra điều kiện bảo hành" });
        });
    }
  }, [serviceOrder?.id]);

  // Lấy danh sách phụ tùng
  const parts = useMemo(() => {
    return serviceOrder?.items?.filter((item) => item.type === "part") || [];
  }, [serviceOrder]);

  // Gộp dịch vụ và phụ tùng vào 1 mảng, thêm loại
  const allItems = useMemo(() => {
    const services =
      serviceOrder?.items?.filter((item) => item.type === "service") || [];

    return [
      ...services.map((item) => ({ ...item, category: "Dịch vụ" })),
      ...parts.map((item) => ({ ...item, category: "Phụ tùng" })),
    ];
  }, [serviceOrder, parts]);

  // Xử lý chọn/bỏ chọn phụ tùng
  const handlePartToggle = (part) => {
    setSelectedParts((prev) => {
      const isSelected = prev.some((p) => p.partId === part.partId);
      if (isSelected) {
        return prev.filter((p) => p.partId !== part.partId);
      } else {
        return [
          ...prev,
          {
            partId: part.partId,
            partName: part.partName || part.name,
            quantity: part.quantity || 1,
          },
        ];
      }
    });
  };

  // Xử lý nút bảo hành
  const handleWarrantyClick = () => {
    if (selectedParts.length === 0) return;
    
    // Chuyển đến trang đặt lịch bảo hành với thông tin đã chọn
    navigate(`/warranty-booking`, {
      state: {
        vehicleId: booking.vehicle?.id,
        serviceOrderId: serviceOrder?.id,
        selectedParts: selectedParts,
        vehicle: booking.vehicle,
      },
    });
  };

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
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <Container className="space-y-6 my-8 w-full max-w-7xl">
      {/* Tất cả nội dung trong một Card duy nhất */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/profile?tab=history")}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Quay lại lịch sử sửa xe</span>
            </button>
            <Badge variant="outline">
              {translateBookingStatus(booking.status)}
            </Badge>
          </div>
          <CardTitle>Chi Tiết Lịch Sử Sửa Xe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="grid gap-4 md:grid-cols-3 pb-6 border-b">
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
          </div>

          {/* Layout 2 cột: Bảng bên trái, Tổng tiền bên phải */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bảng dịch vụ và phụ tùng - Chiếm 2 cột */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Package className="size-5" />
                <h4 className="font-semibold text-lg">
                  Dịch Vụ & Phụ Tùng Đã Sử Dụng
                  {allItems.length > 0 && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      ({allItems.length})
                    </span>
                  )}
                </h4>
              </div>
              <div>
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
                      {parts.length > 0 && <TableHead className="w-12"></TableHead>}
                      <TableHead>STT</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item, index) => {
                      const isPart = item.category === "Phụ tùng";
                      const isSelected = selectedParts.some(
                        (p) => p.partId === item.partId
                      );
                      return (
                        <TableRow key={index}>
                          {parts.length > 0 && (
                            <TableCell>
                              {isPart ? (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handlePartToggle(item)}
                                />
                              ) : null}
                            </TableCell>
                          )}
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
                            {item.name || item.partName || "N/A"}
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
                      );
                    })}
                    {/* Thêm các dòng trống để giữ layout ổn định */}
                    {Array.from({ length: Math.max(0, itemsPerPage - currentItems.length) }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[57px]">
                        {parts.length > 0 && <TableCell></TableCell>}
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Phân trang */}
                {allItems.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Trang {currentPage} / {totalPages} - Hiển thị {startIndex + 1} -{" "}
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
            {parts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  {warrantyEligibility && !warrantyEligibility.eligible && (
                    <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      {warrantyEligibility.reason}
                      {warrantyEligibility.daysRemaining !== undefined && warrantyEligibility.daysRemaining > 0 && (
                        <span className="block mt-1">
                          Còn {warrantyEligibility.daysRemaining} ngày để bảo hành
                        </span>
                      )}
                    </div>
                  )}
                  {warrantyEligibility && warrantyEligibility.eligible && (
                    <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      Có thể bảo hành. Còn {warrantyEligibility.daysRemaining} ngày để yêu cầu bảo hành.
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedParts.length > 0
                        ? `Đã chọn ${selectedParts.length} phụ tùng để bảo hành`
                        : "Chọn phụ tùng cần bảo hành"}
                    </div>
                    {selectedParts.length > 0 && warrantyEligibility?.eligible && (
                      <Button
                        onClick={handleWarrantyClick}
                        className="gap-2"
                        size="sm"
                      >
                        <Shield className="h-4 w-4" />
                        Bảo hành
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>

            {/* Tổng tiền - Chiếm 1 cột */}
            {serviceOrder && allItems.length > 0 && (
              <div className="lg:col-span-1">
                <h4 className="font-semibold text-lg mb-4">Tổng Kết</h4>
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
                  
                  {/* Chính sách bảo hành */}
                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Chính Sách Bảo Hành
                      </h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Khách hàng có thể yêu cầu bảo hành trong vòng <strong>7 ngày</strong> kể từ ngày hoàn thành đơn sửa chữa.</p>
                        <p>• Chỉ áp dụng cho các phụ tùng đã được sửa chữa/thay thế trong đơn.</p>
                        <p>• Mỗi đơn sửa chữa chỉ được bảo hành <strong>1 lần duy nhất</strong>.</p>
                        <p>• Dịch vụ bảo hành và phụ tùng bảo hành sẽ được miễn phí (giá = 0 đồng).</p>
                        <p>• Thời gian bảo hành: <strong>6 tháng</strong> kể từ ngày bảo hành.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </Container>
    </div>
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
