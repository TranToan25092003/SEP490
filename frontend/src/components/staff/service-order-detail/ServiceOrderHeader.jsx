import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/global/StatusBadge";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { useServiceOrder } from "./ServiceOrderContext";

/**
 * ServiceOrderHeader Component
 * Displays the high-level service order metadata and technician assignments.
 */
const ServiceOrderHeader = ({
  className,
  ...props
}) => {
  const { serviceOrder, confirmServiceOrderLoading, disabled } = useServiceOrder();
  const { watch } = useFormContext();
  const services = watch("services");
  const hasServices = Array.isArray(services) && services.length > 0;

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CardTitle>Thông Tin Chung (ID: {serviceOrder.id})</CardTitle>
        </div>
        <div className="space-x-2">
          <Button
            type="button"
            className="text-destructive"
            variant="outline"
            onClick={() => onCancelServiceOrder()}
            disabled={confirmServiceOrderLoading || disabled}
            aria-busy={confirmServiceOrderLoading}
          >
            Từ chối lệnh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancelServiceOrder()}
            disabled={confirmServiceOrderLoading || disabled}
            aria-busy={confirmServiceOrderLoading}
          >
            Đổi lịch
          </Button>
          <Button
            type="submit"
            disabled={confirmServiceOrderLoading || disabled || !hasServices}
            aria-busy={confirmServiceOrderLoading}
          >
            Xác nhận & Tạo Lệnh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Tên Khách Hàng</Label>
          <div className="font-semibold">{serviceOrder.customerName}</div>
        </div>

        <div className="space-y-2">
          <Label>Thời Gian Mong Muốn</Label>
          <div className="font-semibold">{serviceOrder.appointmentTime}</div>
        </div>

        <div className="space-y-2">
          <Label>Xe</Label>
          <div className="font-semibold">{serviceOrder.licensePlate}</div>
        </div>

        <div className="space-y-2">
          <Label className="gap-1">
            Thợ sửa &#183;
            <Button variant="link" className="leading-none" onClick={() => onEditTechnician(serviceOrder.fixTechnician)}>Thay đổi</Button>
          </Label>
          <div className="font-semibold">{serviceOrder.fixTechnician?.name}</div>
        </div>

        <div className="space-y-2">
          <Label>Bay {serviceOrder.bayInfo?.isFinal ? "" : "(tạm thời)"}</Label>
          <div className="font-semibold">{serviceOrder.bayInfo?.name}</div>
        </div>

        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <StatusBadge status={serviceOrder.status ?? "Không xác định"} />
        </div>
      </CardContent>
    </Card>
  );
};

ServiceOrderHeader.displayName = "ServiceOrderHeader";

export default ServiceOrderHeader;
