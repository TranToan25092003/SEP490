import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

/** @typedef {import("./index").BookingHeaderProps} BookingHeaderProps */
/** @typedef {import("./index").ServiceInfo} ServiceInfo */

/**
 * Displays the high-level booking metadata and technician assignments.
 * @param {BookingHeaderProps} props
 */
const BookingHeader = ({
  booking,
  confirmBookingLoading = false,
  className,
  ...props
}) => {
  const { watch } = useFormContext();

  /** @type {ServiceInfo[]} */
  const services = watch("services", []);
  const serviceSummary = services.length
    ? services.map((s) => s.name).join(", ")
    : "Không có dịch vụ";

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Thông Tin Chung (ID: {booking.id})</CardTitle>
        <Button
          type="button"
          disabled={confirmBookingLoading}
          aria-busy={confirmBookingLoading}
        >
          Xác nhận & Tạo Lệnh
        </Button>
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
          <Label>Yêu Cầu Ban Đầu</Label>
          <div className="font-semibold">{serviceSummary}</div>
        </div>

        <div className="space-y-2">
          <Label>Thợ sửa</Label>
          <Select defaultValue={booking.fixTechnician?.id}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn thợ sửa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nguyễn Văn A</SelectItem>
              <SelectItem value="2">Trần Văn B</SelectItem>
              <SelectItem value="3">Lê Văn C</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Thợ bay</Label>
          <Select defaultValue={booking.bayTechnician?.id}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn thợ bay" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nguyễn Văn A</SelectItem>
              <SelectItem value="2">Trần Văn B</SelectItem>
              <SelectItem value="3">Lê Văn C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

BookingHeader.displayName = "BookingHeader";

export default BookingHeader;
