import { formatDateTime } from "@/lib/utils";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRevalidator } from "react-router-dom";
import { cancelBooking } from "@/api/bookings";
import { toast } from "sonner";

/** @typedef {import("./index").BookingStatusHeaderProps} BookingStatusHeaderProps */

/**
 * BookingStatusHeader component to display booking status information
 * in grid layout
 * @param {BookingStatusHeaderProps} props
 */
const BookingStatusHeader = ({
  bookingId,
  customerName,
  status,
  licensePlate,
  creationDate,
  serviceOrderStatus,
  tasks = [],
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();

  // Kiểm tra xem có thể hủy đơn không
  // Chỉ cho phép hủy ở: tiếp nhận (booked, checked_in) hoặc chờ duyệt báo giá
  const canCancel = () => {
    // Đã hủy hoặc đã hoàn thành thì không cho hủy
    if (status === "cancelled" || status === "completed") {
      return false;
    }

    // Cho phép hủy khi đang ở bước tiếp nhận
    if (status === "booked" || status === "checked_in") {
      return true;
    }

    // Cho phép hủy khi đang chờ duyệt báo giá
    if (serviceOrderStatus === "waiting_customer_approval") {
      return true;
    }

    // Kiểm tra nếu đã bắt đầu kiểm tra (inspection task đã bắt đầu)
    const inspectionTask = tasks.find((t) => t.type === "inspection");
    if (inspectionTask && inspectionTask.status !== "scheduled" && inspectionTask.status !== "rescheduled") {
      return false; // Đã bắt đầu kiểm tra, không cho hủy
    }

    // Kiểm tra nếu đã bắt đầu sửa chữa (servicing task đã bắt đầu)
    const servicingTask = tasks.find((t) => t.type === "servicing");
    if (servicingTask && servicingTask.status !== "scheduled" && servicingTask.status !== "rescheduled") {
      return false; // Đã bắt đầu sửa chữa, không cho hủy
    }

    // Các trường hợp khác không cho hủy
    return false;
  };

  const handleCancel = async () => {
    if (!canCancel()) {
      toast.error("Không thể hủy đơn ở giai đoạn này");
      return;
    }

    try {
      setLoading(true);

      const cancelPromise = cancelBooking(bookingId);
      await toast
        .promise(cancelPromise, {
          loading: "Đang hủy đơn...",
          success: "Hủy đơn thành công!",
          error: "Hủy đơn thất bại. Vui lòng thử lại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.error("Error cancelling booking:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className} {...props}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Thông tin chung</h2>

        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={loading || !canCancel()}
          title={
            !canCancel()
              ? "Không thể hủy đơn ở giai đoạn này. Chỉ có thể hủy đơn khi đang tiếp nhận hoặc chờ duyệt báo giá."
              : "Hủy đơn đặt lịch"
          }
        >
          Hủy đơn
        </Button>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Mã Đặt</div>
            <div className="font-semibold text-foreground">{bookingId}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Tên Khách Hàng</div>
            <div className="font-semibold text-foreground">{customerName}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Xe</div>
            <div className="font-semibold text-foreground">{licensePlate}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Thời gian tạo</div>
            <div className="font-semibold text-foreground">
              {formatDateTime(creationDate)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Trạng Thái</div>
            <div className="font-semibold text-foreground bg-accent text-foreground-accent px-3 inline-block rounded-full">
              {translateBookingStatus(status)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

BookingStatusHeader.displayName = "BookingStatusHeader";
export default BookingStatusHeader;
