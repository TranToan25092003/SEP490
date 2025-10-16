import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Car, Wrench } from "lucide-react";
import { cn, formatPrice, formatTimeXGioYPhut } from "@/lib/utils";

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *   myCar: {
 *     licensePlate: string;
 *   };
 * }} ConfirmationStepProps
 */

/**
 * ConfirmationStep component for reviewing booking details before submission.
 * Uses useFormContext to access form data.
 * @param {ConfirmationStepProps} props
 */
const ConfirmationStep = ({ myCar, className, ...props }) => {
  const { watch } = useFormContext();
  const services = watch("services") || [];
  const timeslot = watch("timeslot");


  const getTotalPrice = () => {
    return services.reduce((sum, service) => sum + service.basePrice, 0);
  };

  const getTotalTime = () => {
    return services.reduce((sum, service) => sum + service.estimatedTime, 0);
  };

  const formatDateTime = () => {
    if (!timeslot) return "Chưa chọn";

    return new Date(
      timeslot.year,
      timeslot.month,
      timeslot.day,
      timeslot.hours,
      timeslot.minutes
    ).toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="text-center">
        <h1>
          <span className="text-2xl font-bold">Xác nhận đặt lịch</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vui lòng kiểm tra lại thông tin đặt lịch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Thông tin xe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {myCar.licensePlate}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Thời gian hẹn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!timeslot ? (
              <p className="text-gray-500">Chưa chọn thời gian</p>
            ) : (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <p className="text-lg">{formatDateTime()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Dịch vụ đã chọn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-gray-500">Chưa chọn dịch vụ nào</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.sid}
                  className={cn(
                    "flex justify-between items-start p-3 rounded",
                    "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{service.name}</p>
                    {service.desc && (
                      <p className={cn("text-sm mt-1", "text-gray-600 dark:text-gray-400") }>
                        {service.desc}
                      </p>
                    )}
                    <p className={cn("text-sm mt-1 text-gray-500") }>
                      Thời gian: {formatTimeXGioYPhut(service.estimatedTime)}
                    </p>
                  </div>
                  <span className="font-semibold text-primary ml-4">
                    {formatPrice(service.basePrice)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="font-semibold">Tổng cộng:</p>
                  <p className="text-sm text-gray-500">
                    Tổng thời gian: {formatTimeXGioYPhut(getTotalTime())}
                  </p>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500 mt-4">
        <p>Nhấn "Hoàn thành" để xác nhận đặt lịch</p>
      </div>
    </div>
  );
};

ConfirmationStep.displayName = "ConfirmationStep";

export default ConfirmationStep;
