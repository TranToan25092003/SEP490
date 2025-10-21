import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn, formatTimeXGioYPhut } from "@/lib/utils";

/** @typedef {import("./index").ServiceSelectionStepProps} ServiceSelectionStepProps */

/**
 * ServiceSelectionStep component for selecting services in the booking form.
 * Uses useFormContext to access form methods and state.
 * @param {ServiceSelectionStepProps} props
 */
const ServiceSelectionStep = ({ services, className, ...props }) => {
  const {
    fields: selectedServices,
    remove,
    append,
  } = useFieldArray({
    name: "services",
  });

  const handleServiceToggle = (service) => {
    const idx = selectedServices.findIndex((s) => s.sid === service.sid);
    const isSelected = idx !== -1;

    if (isSelected) {
      remove(idx);
    } else {
      append(service);
    }
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="text-center mb-6">
        <h1>
          <span className="text-2xl font-bold">Chọn dịch vụ</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Chọn một hoặc nhiều dịch vụ cho xe của bạn
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const isSelected = selectedServices.some(
            (s) => s.sid === service.sid
          );

          return (
            <Card
              key={service.sid}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "border-primary border-2"
              )}
              onClick={() => handleServiceToggle(service)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className={cn("p-1 rounded", isSelected ? "bg-primary/10" : "bg-gray-200")}>
                    <Check className={cn("h-4 w-4", isSelected ? "text-primary" : "text-gray-400 invisible")} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {service.desc && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {service.desc}
                  </p>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-500">
                    Thời gian: {formatTimeXGioYPhut(service.estimatedTime)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

ServiceSelectionStep.displayName = "ServiceSelectionStep";

export default ServiceSelectionStep;
