import { useState, Suspense } from "react";
import { useLoaderData, useRevalidator, Await, Link } from "react-router-dom";
import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/global/StatusBadge";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";
import { getBookingById, checkInBooking, cancelBooking } from "@/api/bookings";
import { toast } from "sonner";
import { Calendar, Clock, Car, User, Package, AlertCircle } from "lucide-react";
import { translateBookingStatus } from "@/utils/enumsTranslator";

/**
 * Format timeslot to readable string
 * @param {string} startTime - ISO date string
 * @param {string} endTime - ISO date string
 * @returns {string} Formatted timeslot
 */
const formatTimeSlot = (startTime, endTime) => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours().toString().padStart(2, "0");
    const startMinute = start.getMinutes().toString().padStart(2, "0");
    const endHour = end.getHours().toString().padStart(2, "0");
    const endMinute = end.getMinutes().toString().padStart(2, "0");
    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
  } catch {
    return "N/A";
  }
};

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function loader({ params }) {
  return {
    booking: getBookingById(params.id),
  };
}

const BookingDetailContent = ({ booking, revalidator }) => {
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      await checkInBooking(booking.id);
      toast.success("Check-in thành công!");
      revalidator.revalidate();
    } catch (err) {
      toast.error(err.message || "Không thể check-in");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt lịch này?")) {
      return;
    }

    try {
      setCancelLoading(true);
      await cancelBooking(booking.id);
      toast.success("Hủy đặt lịch thành công!");
      revalidator.revalidate();
    } catch (err) {
      toast.error(err.message || "Không thể hủy đặt lịch");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/booking" label="Quay lại danh sách đặt lịch" />
      <H3>Chi Tiết Đặt Lịch</H3>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Header Card - Full Width */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>Thông Tin Đặt Lịch</CardTitle>
            </div>
            <div className="space-x-2">
              {booking.status === "in_progress" && booking.serviceOrderId ? (
                <Link to={`/staff/service-order/${booking.serviceOrderId}`}>
                  <Button type="button">
                    Xem lệnh sửa chữa
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive"
                    onClick={handleCancel}
                    disabled={
                      cancelLoading || checkInLoading || booking.status !== "booked"
                    }
                    aria-busy={cancelLoading}
                  >
                    {cancelLoading && <Spinner className="size-4 mr-2" />}
                    Hủy đặt lịch
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={
                      checkInLoading || cancelLoading || booking.status !== "booked"
                    }
                    aria-busy={checkInLoading}
                  >
                    {checkInLoading && <Spinner className="size-4 mr-2" />}
                    Check-in
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="size-4" />
                Khách Hàng
              </Label>
              <div className="font-semibold">
                {booking.customer?.customerName || "N/A"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="size-4" />
                Slot
              </Label>
              <div className="font-semibold">
                {formatDate(booking.slotStartTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimeSlot(booking.slotStartTime, booking.slotEndTime)}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="size-4" />
                Trạng Thái
              </Label>
              <StatusBadge status={translateBookingStatus(booking.status)} />
            </div>

            {booking.serviceOrderId && (
              <div className="space-y-2">
                <Label>Mã Lệnh Sửa Chữa</Label>
                <div className="font-semibold">{booking.serviceOrderId}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Dịch Vụ Đã Đặt
              {booking.services && booking.services.length > 0 && (
                <span className="text-muted-foreground font-normal text-sm">
                  ({booking.services.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!booking.services || booking.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">
                  Không có dịch vụ nào
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {booking.services.map((service, idx) => (
                  <div
                    key={service.id || idx}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{service.name || "N/A"}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(service.basePrice || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Details Card */}
        {booking.vehicle && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="size-5" />
                Thông Tin Xe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <Label className="font-medium">Biển Số</Label>
                  <div className="font-semibold">
                    {booking.vehicle.licensePlate || "N/A"}
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <Label className="font-medium">Mẫu Xe</Label>
                  <div className="font-semibold">
                    {booking.vehicle.model || "N/A"}
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <Label className="font-medium">Hãng</Label>
                  <div className="font-semibold">
                    {booking.vehicle.brand || "N/A"}
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <Label className="font-medium">Năm Sản Xuất</Label>
                  <div className="font-semibold">
                    {booking.vehicle.year || "N/A"}
                  </div>
                </div>

                {booking.vehicle.odoReading !== undefined && (
                  <div className="flex justify-between py-2">
                    <Label className="font-medium">Số Km Đã Chạy</Label>
                    <div className="font-semibold">
                      {booking.vehicle.odoReading.toLocaleString("vi-VN")} km
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
};

BookingDetailContent.displayName = "BookingDetailContent";

const BookingDetailSkeleton = () => (
  <Container pageContext="admin">
    <BackButton to="/staff/booking" label="Quay lại danh sách đặt lịch" />
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner className="size-8" />
    </div>
  </Container>
);

const BookingDetailError = ({ revalidator }) => (
  <Container pageContext="admin">
    <BackButton to="/staff/booking" label="Quay lại danh sách đặt lịch" />
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="size-12 text-destructive" />
      <p className="text-lg font-medium text-destructive">
        Không thể tải thông tin đặt lịch
      </p>
      <Button onClick={() => revalidator.revalidate()}>Thử lại</Button>
    </div>
  </Container>
);

const BookingDetail = () => {
  const { booking } = useLoaderData();
  const revalidator = useRevalidator();

  return (
    <Suspense fallback={<BookingDetailSkeleton />}>
      <Await
        resolve={booking}
        errorElement={<BookingDetailError revalidator={revalidator} />}
      >
        {(data) => (
          <BookingDetailContent booking={data} revalidator={revalidator} />
        )}
      </Await>
    </Suspense>
  );
};

BookingDetail.displayName = "BookingDetail";
BookingDetail.loader = loader;
export default BookingDetail;
