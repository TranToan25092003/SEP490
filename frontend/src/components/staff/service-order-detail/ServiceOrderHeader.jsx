import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/global/StatusBadge";
import { cn } from "@/lib/utils";
import { useServiceOrder } from "./ServiceOrderContext";
import { translateServiceOrderStatus } from "@/utils/enumsTranslator";
import { Link } from "react-router-dom";

const ServiceOrderHeader = ({ className, ...props }) => {
  const { serviceOrder, disabled, handleCancelServiceOrder } =
    useServiceOrder();

  // Kiểm tra xem có thể hủy lệnh không (chỉ cho STAFF)
  // Chỉ cho phép hủy ở 3 trạng thái: created, waiting_customer_approval, inspection_completed
  const canCancel = () => {
    // Đã hủy hoặc đã hoàn thành thì không cho hủy
    if (
      serviceOrder.status === "cancelled" ||
      serviceOrder.status === "completed"
    ) {
      return false;
    }

    // Chỉ cho phép hủy ở 3 trạng thái sau:
    const allowedStatuses = [
      "created",
      "waiting_customer_approval",
      "inspection_completed",
    ];

    if (allowedStatuses.includes(serviceOrder.status)) {
      return true;
    }

    // Tất cả các trạng thái khác không cho hủy
    return false;
  };

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CardTitle>Thông tin chung</CardTitle>
        </div>
        <div className="space-x-2">
          {canCancel() && (
            <Button
              type="button"
              className="text-destructive"
              variant="outline"
              onClick={() => handleCancelServiceOrder(serviceOrder)}
              disabled={disabled}
              aria-busy={disabled}
              title={
                !canCancel()
                  ? "Không thể hủy lệnh ở giai đoạn này. Chỉ có thể hủy khi ở trạng thái: Đã tạo, Chờ khách duyệt, hoặc Đã kiểm tra."
                  : "Hủy lệnh sửa chữa"
              }
            >
              Hủy lệnh
            </Button>
          )}
          <Link to={`/staff/service-order/${serviceOrder.id}/progress`}>
            <Button>Xem tiến độ</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label>Tên khách hàng</Label>
          <div className="font-semibold">{serviceOrder.customerName}</div>
        </div>

        <div className="space-y-2">
          <Label>Số điện thoại</Label>
          <div className="font-semibold">
            {serviceOrder.customerPhone || "Chưa cập nhật"}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Biển số</Label>
          <div className="font-semibold">{serviceOrder.licensePlate}</div>
        </div>

        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <StatusBadge
            status={translateServiceOrderStatus(serviceOrder.status)}
          />
        </div>
      </CardContent>
      {serviceOrder.status === "cancelled" && (
        <CardContent className="border-t pt-4">
          <div className="space-y-2">
            <Label className="text-destructive">Thông tin hủy lệnh</Label>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-semibold">Người hủy: </span>
                <span>
                  {serviceOrder.cancelledBy === "staff"
                    ? "Nhân viên"
                    : serviceOrder.cancelledBy === "customer"
                    ? "Khách hàng"
                    : "Không xác định"}
                </span>
              </div>
              {serviceOrder.cancelReason && (
                <div className="text-sm">
                  <span className="font-semibold">Lý do: </span>
                  <span>{serviceOrder.cancelReason}</span>
                </div>
              )}
              {serviceOrder.cancelledAt && (
                <div className="text-sm text-muted-foreground">
                  Thời gian:{" "}
                  {new Date(serviceOrder.cancelledAt).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

ServiceOrderHeader.displayName = "ServiceOrderHeader";

export default ServiceOrderHeader;
