import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/global/StatusBadge";
import { cn } from "@/lib/utils";
import { useServiceOrder } from "./ServiceOrderContext";
import { translateServiceOrderStatus } from "@/utils/enumsTranslator";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router-dom";

const ServiceOrderHeader = ({ className, ...props }) => {
  const {
    serviceOrder,
    disabled,
    handleCancelServiceOrder,
    handleStartServiceOrder,
  } = useServiceOrder();
  const { watch } = useFormContext();
  const items = watch();
  const hasServices = items.services.length + items.parts.length > 0;

  function getButton() {
    const status = serviceOrder.status;
    if (status === "created") {
      return (
        <Button
          type="submit"
          onClick={() => handleStartServiceOrder(serviceOrder)}
          disabled={disabled || !hasServices}
          aria-busy={disabled || !hasServices}
        >
          Bắt đầu
        </Button>
      );
    } else {
      return (
        <Link to={`/staff/service-order/${serviceOrder.id}/progress`}>
          <Button>Xem tiến độ</Button>
        </Link>
      );
    }
  }

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CardTitle>Thông tin chung</CardTitle>
        </div>
        <div className="space-x-2">
          {serviceOrder.status !== "cancelled" &&
            serviceOrder.status !== "completed" && (
              <Button
                type="button"
                className="text-destructive"
                variant="outline"
                onClick={() => handleCancelServiceOrder(serviceOrder)}
                disabled={disabled}
                aria-busy={disabled}
              >
                Hủy lệnh
              </Button>
            )}
          {getButton(serviceOrder)}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Tên khách hàng</Label>
          <div className="font-semibold">{serviceOrder.customerName}</div>
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
    </Card>
  );
};

ServiceOrderHeader.displayName = "ServiceOrderHeader";

export default ServiceOrderHeader;
