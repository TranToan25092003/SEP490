import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/global/StatusBadge";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

/** @typedef {import("./index").BookingHeaderProps} BookingHeaderProps */

/**
 * Displays the high-level booking metadata and technician assignments.
 * @param {BookingHeaderProps} props
 */
const BookingHeader = ({
  booking,
  confirmBookingLoading = false,
  disabled = false,
  className,
  ...props
}) => {
  const { watch } = useFormContext();
  const services = watch("services");
  const hasServices = Array.isArray(services) && services.length > 0;

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CardTitle>Thông Tin Chung (ID: {booking.id})</CardTitle>
        </div>
        <div className="space-x-2">
          <Button
            type="button"
            className="text-destructive"
            variant="outline"
            onClick={() => onCancelBooking()}
            disabled={confirmBookingLoading || disabled}
            aria-busy={confirmBookingLoading}
          >
            Từ chối lệnh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancelBooking()}
            disabled={confirmBookingLoading || disabled}
            aria-busy={confirmBookingLoading}
          >
            Đổi lịch
          </Button>
          <Button
            type="submit"
            disabled={confirmBookingLoading || disabled || !hasServices}
            aria-busy={confirmBookingLoading}
          >
            Xác nhận & Tạo Lệnh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Tên Khách Hàng</Label>
          <div className="font-semibold">{booking.customerName}</div>
        </div>

        <div className="space-y-2">
          <Label>Thời Gian Mong Muốn</Label>
          <div className="font-semibold">{booking.appointmentTime}</div>
        </div>

        <div className="space-y-2">
          <Label>Xe</Label>
          <div className="font-semibold">{booking.licensePlate}</div>
        </div>

        <div className="space-y-2">
          <Label className="gap-1">
            Thợ sửa &#183;
            <Button variant="link" className="leading-none" onClick={() => onEditTechnician(booking.fixTechnician)}>Thay đổi</Button>
          </Label>
          <div className="font-semibold">{booking.fixTechnician?.name}</div>
        </div>

        <div className="space-y-2">
          <Label>Bay {booking.bayInfo?.isFinal ? "" : "(tạm thời)"}</Label>
          <div className="font-semibold">{booking.bayInfo?.name}</div>
        </div>

        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <StatusBadge status={booking.status ?? "Không xác định"} />
        </div>
      </CardContent>
    </Card>
  );
};

BookingHeader.displayName = "BookingHeader";

export default BookingHeader;
