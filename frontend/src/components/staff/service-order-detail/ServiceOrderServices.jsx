import { Plus, Package, Wrench, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useServiceOrder } from "./ServiceOrderContext";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChooseServiceModal from "./ChooseServiceModal";
import ChoosePartsModal from "./ChoosePartsModal";
import NiceModal from "@ebay/nice-modal-react";
import { Warehouse } from "lucide-react";
import { NumericFormat } from "react-number-format";

const PartItemRow = ({
  index,
  disabled,
  control,
  register,
  errors,
  ...props
}) => (
  <div className="grid grid-cols-12 items-start gap-2 px-3" {...props}>
    <div className="col-span-5">
      {index === 0 && (
        <label
          htmlFor={`parts.${index}.partName`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Tên phụ tùng
        </label>
      )}
      <Input
        id={`parts.${index}.partName`}
        placeholder="Nhập tên phụ tùng"
        {...register(`parts.${index}.partName`, { disabled: true })}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
      />
      {errors?.parts?.[index]?.partId && (
        <p className="text-sm text-red-500 mt-1">
          {errors.parts[index].partId.message}
        </p>
      )}
    </div>

    <div className="col-span-3">
      {index === 0 && (
        <label
          htmlFor={`parts.${index}.price`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Giá
        </label>
      )}
      <Controller
        name={`parts.${index}.price`}
        control={control}
        render={({ field: { value } }) => {
          console.log(value);
          return (
            <NumericFormat
              customInput={Input}
              value={value}
              id={`parts.${index}.price`}
              placeholder="Giá"
              thousandSeparator=","
              suffix=" ₫"
              disabled={true}
              className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
            />
          );
        }}
      />
      {errors?.parts?.[index]?.price && (
        <p className="text-sm text-red-500 mt-1">
          {errors.parts[index].price.message}
        </p>
      )}
    </div>

    <div className="col-span-2">
      {index === 0 && (
        <label
          htmlFor={`parts.${index}.quantity`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Số lượng
        </label>
      )}
      <Input
        id={`parts.${index}.quantity`}
        placeholder="Số lượng"
        type="number"
        {...register(`parts.${index}.quantity`)}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
        disabled={disabled}
        min={1}
      />
      {errors?.parts?.[index]?.quantity && (
        <p className="text-sm text-red-500 mt-1">
          {errors.parts[index].quantity.message}
        </p>
      )}
    </div>

    <div className="col-span-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        {...props.onRemove}
        className={cn("w-full", index === 0 ? "relative top-7" : null)}
      >
        Xóa
      </Button>
    </div>
  </div>
);

const ServiceItemRow = ({
  index,
  disabled,
  control,
  register,
  errors,
  ...props
}) => (
  <div className="grid grid-cols-12 items-start gap-2 px-3">
    <div className="col-span-5">
      {index === 0 && (
        <label
          htmlFor={`services.${index}.name`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Tên dịch vụ
        </label>
      )}
      <Input
        id={`services.${index}.name`}
        placeholder="Nhập tên dịch vụ"
        {...register(`services.${index}.name`)}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
        disabled={disabled}
      />
      {errors?.services?.[index]?.serviceId && (
        <p className="text-sm text-red-500 mt-1">
          {errors.services[index].serviceId.message}
        </p>
      )}
    </div>

    <div className="col-span-3">
      {index === 0 && (
        <label
          htmlFor={`services.${index}.price`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Giá
        </label>
      )}
      <Controller
        name={`services.${index}.price`}
        control={control}
        render={({ field: { onChange, value } }) => {
          console.log(value);
          return (
            <NumericFormat
              customInput={Input}
              value={value}
              onValueChange={(v) => onChange(v.value)}
              id={`services.${index}.price`}
              placeholder="Giá"
              thousandSeparator=","
              suffix=" ₫"
              disabled={disabled}
              className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
            />
          );
        }}
      />
      {errors?.services?.[index]?.price && (
        <p className="text-sm text-red-500 mt-1">
          {errors.services[index].price.message}
        </p>
      )}
    </div>

    <div className="col-span-2">
      {index === 0 && (
        <label
          htmlFor={`services.${index}.quantity`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Số lượng
        </label>
      )}
      <Input
        id={`services.${index}.quantity`}
        placeholder="Số lượng"
        type="number"
        {...register(`services.${index}.quantity`)}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
        disabled={disabled}
        min={1}
      />
      {errors?.services?.[index]?.quantity && (
        <p className="text-sm text-red-500 mt-1">
          {errors.services[index].quantity.message}
        </p>
      )}
    </div>

    <div className="col-span-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        {...props.onRemove}
        className={cn("w-full", index === 0 ? "relative top-7" : null)}
      >
        Xóa
      </Button>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <Icon className="w-8 h-8 text-muted-foreground/50 mb-2" />
    <p className="text-sm text-muted-foreground">{title}</p>
  </div>
);

const ServiceOrderServices = ({ className, ...props }) => {
  const { disabled } = useServiceOrder();
  const { register, control, formState: { errors } } = useFormContext();

  const partsMethods = useFieldArray({
    name: "parts",
  });

  const serviceItemsMethods = useFieldArray({
    name: "services",
  });

  const handleAddPart = async () => {
    try {
      const parts = await NiceModal.show(ChoosePartsModal);
      for (const part of parts) {
        console.log(part);
        partsMethods.append({
          type: "part",
          partId: part._id,
          partName: part.name,
          price: part.sellingPrice,
          quantity: 1
        });
      }
    } catch (error) {
      console.error("Failed to open ChoosePartsModal:", error);
    }
  };

  const handleAddServiceFromInventory = async () => {
    try {
      const services = await NiceModal.show(ChooseServiceModal);
      for (const service of services) {
        serviceItemsMethods.append({
          type: "service",
          serviceId: service.id,
          name: service.name,
          price: service.basePrice,
          quantity: 1
        });
      }
    } catch (error) {
      console.error("Failed to open ChooseServiceModal:", error);
    }
  };

  const handleAddEmptyService = () => {
    serviceItemsMethods.append({
      type: "service",
      serviceId: "",
      name: "",
      price: 0,
      quantity: 1
    });
  }

  return (
    <Card className={cn(className, "gap-0")} {...props}>
      <Tabs defaultValue="services" className="contents">
        <CardHeader>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span>Dịch vụ ({serviceItemsMethods.fields.length})</span>
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Phụ tùng ({partsMethods.fields.length})</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="parts" className="contents">
          <CardContent className="flex-1 py-2 max-h-[400px] overflow-y-auto space-y-2">
            {partsMethods.fields.length === 0 ? (
              <EmptyState icon={Package} title="Không có phụ tùng" />
            ) : (
              partsMethods.fields.map((item, index) => {
                return (
                  <PartItemRow
                    key={item.id}
                    index={index}
                    disabled={disabled}
                    register={register}
                    control={control}
                    errors={errors}
                    onRemove={{ onClick: () => partsMethods.remove(index) }}
                  />
                );
              })
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPart}
              disabled={disabled}
              className="w-full"
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Thêm phụ tùng từ kho
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="services" className="contents">
          <CardContent className="flex-1 py-2 max-h-[400px] overflow-y-auto space-y-2">
            {serviceItemsMethods.fields.length === 0 ? (
              <EmptyState icon={Wrench} title="Không có dịch vụ" />
            ) : (
              serviceItemsMethods.fields.map((item, index) => {
                return (
                  <ServiceItemRow
                    key={item.id}
                    index={index}
                    disabled={disabled}
                    control={control}
                    register={register}
                    errors={errors}
                    onRemove={{ onClick: () => serviceItemsMethods.remove(index) }}
                  />
                );
              })
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddServiceFromInventory}
              disabled={disabled}
              className="flex-1"
            >
              <Warehouse className="w-4 h-4 mr-2" />
              Thêm dịch vụ có sẵn
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEmptyService}
              disabled={disabled}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm dịch vụ trống
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

ServiceOrderServices.displayName = "ServiceOrderServices";

export default ServiceOrderServices;
