import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";

/** @typedef {import("./index").BookingStatusHeaderProps} BookingStatusHeaderProps */

/**
 * BookingStatusHeader component to display booking status information
 * in grid layout
 * @param {BookingStatusHeaderProps} props
 */
const BookingStatusHeader = ({
  orderId,
  customerName,
  status,
  licensePlate,
  technicianName,
  creationDate,
  estimatedTime,
  className,
  ...props
}) => {
  return (
    <Card className={className} {...props}>
      <CardTitle className="px-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Hóa đơn - {orderId}
        </h2>
      </CardTitle>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">WO</div>
            <div className="font-semibold text-foreground">{orderId}</div>
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
            <div className="text-sm text-muted-foreground">Chi Nhánh</div>
            <div className="font-semibold text-foreground">Hà Nội</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Kỹ Thuật Viên</div>
            <div className="font-semibold text-foreground">{technicianName}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Trạng Thái</div>
            <div className="font-semibold text-foreground">{status}</div>
          </div>

          {estimatedTime && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ETA</div>
              <div className="font-semibold text-foreground">
                {formatDateTime(estimatedTime)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

BookingStatusHeader.displayName = "BookingStatusHeader";
export default BookingStatusHeader;
