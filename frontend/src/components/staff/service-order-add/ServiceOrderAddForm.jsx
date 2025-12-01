import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { cn, formatPrice } from "@/lib/utils";
import { z } from "zod";
import { vehicleSchema, phoneNumberSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  customerName: z.string().min(1, "Vui lòng nhập tên khách hàng").max(50, "Tên khách hàng quá dài").trim(),
  phone: phoneNumberSchema,
  licensePlate: vehicleSchema.shape.license_plate,
  address: z.string().max(100, "Địa chỉ quá dài").trim().optional(),
  serviceIds: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất một loại lệnh"),
  note: z.string().max(500, "Ghi chú quá dài").optional(),
})

const ServiceOrderAddForm = ({ onSubmit, services, className, ...props }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      licensePlate: "",
      address: "",
      serviceIds: [],
      note: "",
    },
  });

  const hasAvailableServices = Array.isArray(services) && services.length > 0;

  const onFormSubmit = async (data) => {
    try {
      await onSubmit({
        customerName: data.customerName,
        phone: data.phone,
        licensePlate: data.licensePlate,
        serviceIds: data.serviceIds,
        note: data.note,
        address: data.address,
      });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn(className)}
      {...props}
    >
      <FieldSet>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="customerName" className="required-asterisk">
              Tên khách hàng
            </FieldLabel>
            <FieldContent>
              <Input
                id="customerName"
                placeholder="Nguyễn Văn A"
                aria-invalid={!!errors.customerName}
                {...register("customerName")}
              />
              <FieldError>{errors.customerName?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="phone" className="required-asterisk">
              Số điện thoại
            </FieldLabel>
            <FieldContent>
              <Input
                id="phone"
                type="tel"
                placeholder="0123456789"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="licensePlate" className="required-asterisk">
            Biển số xe
          </FieldLabel>
          <FieldContent>
            <Input
              id="licensePlate"
              placeholder="29-G1-12345"
              aria-invalid={!!errors.licensePlate}
              {...register("licensePlate")}
            />
            <FieldError>{errors.licensePlate?.message}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Địa chỉ</FieldLabel>
          <FieldContent>
            <Input id="address" placeholder="Địa chỉ" {...register("address")} />
            <FieldError>{errors.address?.message}</FieldError>
          </FieldContent>
        </Field>

        <FieldGroup className="gap-2">
          <FieldLegend className="required-asterisk">
            Loại lệnh
          </FieldLegend>
          {services?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {services.map((service) => {
                const normalizedId =
                  service?.id != null ? String(service.id) : "";
                return (
                  <Field key={normalizedId} orientation="horizontal">
                    <Controller
                      name="serviceIds"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id={`service-${normalizedId}`}
                          checked={field.value.includes(normalizedId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (!field.value.includes(normalizedId)) {
                                field.onChange([...field.value, normalizedId]);
                              }
                            } else {
                              field.onChange(
                                field.value.filter((id) => id !== normalizedId)
                              );
                            }
                          }}
                        />
                      )}
                    />
                    <FieldLabel
                      htmlFor={`service-${normalizedId}`}
                      className="cursor-pointer font-normal"
                    >
                      <span>{service.name}</span>
                      {service.basePrice !== undefined && (
                        <span className="block text-xs text-muted-foreground">
                          {formatPrice(service.basePrice)}
                        </span>
                      )}
                    </FieldLabel>
                  </Field>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Không có dịch vụ khả dụng. Vui lòng kiểm tra lại kho dịch vụ.
            </div>
          )}
          <FieldError>{errors.serviceIds?.message}</FieldError>
        </FieldGroup>

        <Field>
          <FieldLabel htmlFor="note">Ghi Chú</FieldLabel>
          <FieldContent>
            <Textarea
              id="note"
              placeholder="Ghi chú"
              className="min-h-24"
              {...register("note")}
            />
            <FieldError>{errors.note?.message}</FieldError>
          </FieldContent>
        </Field>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !hasAvailableServices}
            className="bg-red-600 hover:bg-red-700 text-white px-8 disabled:opacity-60"
          >
            {!hasAvailableServices
              ? "Chưa có dịch vụ khả dụng"
              : isSubmitting
              ? "Đang tạo..."
              : "Tạo Lệnh"}
          </Button>
        </div>
      </FieldSet>
    </form>
  );
};

ServiceOrderAddForm.displayName = "ServiceOrderAddForm";
export default ServiceOrderAddForm;
