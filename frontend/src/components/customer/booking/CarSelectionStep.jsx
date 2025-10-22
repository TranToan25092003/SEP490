import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

/** @typedef {import("./index").CarSelectionStepProps} CarSelectionStepProps */

/**
 * CarSelectionStep component for selecting a vehicle in the booking form.
 * Uses useFormContext to access form methods and state.
 * @param {CarSelectionStepProps} props
 */
const CarSelectionStep = ({ vehicles, className, ...props }) => {
  const { setValue, watch } = useFormContext();
  const selectedVehicle = watch("vehicle");

  const handleVehicleSelect = (vehicle) => {
    // Only allow selection if vehicle is available
    if (vehicle.isAvailable !== false) {
      setValue("vehicle", vehicle);
    }
  };

  const isVehicleSelected = (vehicle) => {
    if (!selectedVehicle) return false;
    return selectedVehicle.id === vehicle.id;
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="text-center mb-6">
        <h1>
          <span className="text-2xl font-bold">Chọn xe</span>
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Chọn xe cần bảo dưỡng hoặc sửa chữa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles && vehicles.length === 0 && (
          <>
            <div className="text-center col-span-full space-y-2 py-8">
              <p>Bạn chưa có xe nào. Vui lòng thêm xe trước khi đặt lịch.</p>
              <Button variant="outline">
                Thêm xe mới
              </Button>
            </div>
          </>
        )}

        {vehicles && vehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg relative group",
              isVehicleSelected(vehicle) && "ring-2 ring-primary",
              vehicle.isAvailable === false && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleVehicleSelect(vehicle)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  <span className="text-lg">{vehicle.licensePlate}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {vehicle.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hãng xe:</span>
                    <span className="font-medium">{vehicle.brand}</span>
                  </div>
                )}
                {vehicle.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dòng xe:</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                )}
                {vehicle.year && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Năm sản xuất:</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                )}
                {vehicle.color && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Màu sắc:</span>
                    <span className="font-medium">{vehicle.color}</span>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Show "Order" button on hover for unavailable vehicles */}
            {vehicle.isAvailable === false && (
              <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to order/maintenance page
                    window.location.href = "/order";
                  }}
                >
                  Xem tình trạng
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

    </div>
  );
};

CarSelectionStep.displayName = "CarSelectionStep";

export default CarSelectionStep;
