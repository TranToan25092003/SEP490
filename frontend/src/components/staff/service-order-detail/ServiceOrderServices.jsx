import { Plus, Package, Wrench, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useServiceOrder } from "./ServiceOrderContext";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PartItemRow = ({ index, disabled, register, errors, ...props }) => (
  <div className="grid grid-cols-12 items-start gap-2 px-3" {...props}>
    <div className="col-span-5">
      {index === 0 && (
        <label
          htmlFor={`parts.${index}.name`}
          className="text-xs font-semibold text-muted-foreground"
        >
          Tên phụ tùng
        </label>
      )}
      <Input
        id={`parts.${index}.name`}
        placeholder="Nhập tên phụ tùng"
        {...register(`parts.${index}.partId`)}
        readOnly={disabled}
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
      <Input
        id={`parts.${index}.price`}
        placeholder="Giá"
        type="number"
        {...register(`parts.${index}.price`)}
        readOnly={disabled}
        min={0}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
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
        readOnly={disabled}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
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
        {...register(`services.${index}.serviceId`)}
        readOnly={disabled}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
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
      <Input
        id={`services.${index}.price`}
        placeholder="Giá"
        type="number"
        {...register(`services.${index}.price`)}
        readOnly={disabled}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
        min={0}
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
        readOnly={disabled}
        className={cn("mt-1", index === 0 && "mt-1", index !== 0 && "mt-0")}
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
  const { register, formState: { errors } } = useFormContext();

  const partsMethods = useFieldArray({
    name: "parts",
  });

  const serviceItemsMethods = useFieldArray({
    name: "services",
  });

  const handleAddPart = () => {
    partsMethods.append({
      type: "part",
      partId: "",
      price: 0,
      quantity: 1
    });
  };

  const handleAddService = () => {
    serviceItemsMethods.append({
      type: "service",
      serviceId: "",
      price: 0,
      quantity: 1
    });
  };

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
              <Plus className="w-4 h-4 mr-2" />
              Thêm phụ tùng
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
                    register={register}
                    errors={errors}
                    onRemove={{ onClick: () => serviceItemsMethods.remove(index) }}
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
              onClick={handleAddService}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm dịch vụ
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

ServiceOrderServices.displayName = "ServiceOrderServices";

export default ServiceOrderServices;
