import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Wrench, Hammer } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useServiceOrder } from "./ServiceOrderContext";

/**
 * PartItemRow Component
 * Displays a single part item row with editable fields
 */
const PartItemRow = ({ item, idx, disabled, onPartChanged, onRemove }) => (
  <div className="grid grid-cols-12 items-end gap-2 p-3">
    <div className="col-span-5">
      <label
        htmlFor={`part-name-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Tên phụ tùng
      </label>
      <Input
        id={`part-name-${idx}`}
        placeholder="Nhập tên phụ tùng"
        value={item.name || ""}
        onChange={(e) => onPartChanged(idx, "name", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-3">
      <label
        htmlFor={`part-price-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Giá
      </label>
      <Input
        id={`part-price-${idx}`}
        placeholder="0"
        value={formatPrice(item.price || 0)}
        onChange={(e) => onPartChanged(idx, "price", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <label
        htmlFor={`part-quantity-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Số lượng
      </label>
      <Input
        id={`part-quantity-${idx}`}
        placeholder="1"
        type="number"
        value={item.quantity || 1}
        onChange={(e) => onPartChanged(idx, "quantity", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => onRemove(idx)}
        className="w-full"
      >
        Xóa
      </Button>
    </div>
  </div>
);

/**
 * ServiceItemRow Component
 * Displays a single service item row with editable fields
 */
const ServiceItemRow = ({
  item,
  idx,
  disabled,
  onServiceChanged,
  onRemove,
}) => (
  <div className="grid grid-cols-12 items-end gap-2 p-3">
    <div className="col-span-5">
      <label
        htmlFor={`service-name-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Tên dịch vụ
      </label>
      <Input
        id={`service-name-${idx}`}
        placeholder="Nhập tên dịch vụ"
        value={item.name || ""}
        onChange={(e) => onServiceChanged(idx, "name", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-3">
      <label
        htmlFor={`service-price-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Giá
      </label>
      <Input
        id={`service-price-${idx}`}
        placeholder="0"
        value={formatPrice(item.price || 0)}
        onChange={(e) => onServiceChanged(idx, "price", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <label
        htmlFor={`service-quantity-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Số lượng
      </label>
      <Input
        id={`service-quantity-${idx}`}
        placeholder="1"
        type="number"
        value={item.quantity || 1}
        onChange={(e) => onServiceChanged(idx, "quantity", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => onRemove(idx)}
        className="w-full"
      >
        Xóa
      </Button>
    </div>
  </div>
);

/**
 * CustomItemRow Component
 * Displays a single custom item row with editable fields
 */
const CustomItemRow = ({ item, idx, disabled, onCustomChanged, onRemove }) => (
  <div className="grid grid-cols-12 items-end gap-2 p-3">
    <div className="col-span-5">
      <label
        htmlFor={`custom-name-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Tên hạng mục
      </label>
      <Input
        id={`custom-name-${idx}`}
        placeholder="Nhập tên hạng mục"
        value={item.name || ""}
        onChange={(e) => onCustomChanged(idx, "name", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-3">
      <label
        htmlFor={`custom-price-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Giá
      </label>
      <Input
        id={`custom-price-${idx}`}
        placeholder="0"
        value={formatPrice(item.price || 0)}
        onChange={(e) => onCustomChanged(idx, "price", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <label
        htmlFor={`custom-quantity-${idx}`}
        className="text-xs font-semibold text-muted-foreground"
      >
        Số lượng
      </label>
      <Input
        id={`custom-quantity-${idx}`}
        placeholder="1"
        type="number"
        value={item.quantity || 1}
        onChange={(e) => onCustomChanged(idx, "quantity", e.target.value)}
        readOnly={disabled}
        className="mt-1"
      />
    </div>

    <div className="col-span-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={() => onRemove(idx)}
        className="w-full"
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

/**
 * ServiceOrderServices Component
 * Manages the services field array within the service order detail form.
 * Separates items into three sections: Parts, Services, and Custom items.
 */
const ServiceOrderServices = ({ className, ...props }) => {
  const { disabled } = useServiceOrder();
  const { watch } = useFormContext();
  const {
    fields: items,
    append,
    remove,
    update,
  } = useFieldArray({
    name: "items",
  });

  const parts = [];
  const serviceItems = [];
  const customItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === "part") {
      parts.push({ ...item, index: i });
    } else if (item.type === "service") {
      serviceItems.push({ ...item, index: i });
    } else if (item.type === "custom") {
      customItems.push({ ...item, index: i });
    }
  }

  const handleAddPart = () => {
    append({
      type: "part",
      name: "",
      price: 0,
      quantity: 1,
    });
  };

  const handleAddService = () => {
    append({
      type: "service",
      name: "",
      price: 0,
      quantity: 1,
    });
  };

  const handleAddCustom = () => {
    append({
      type: "custom",
      name: "",
      price: 0,
      quantity: 1,
    });
  };

  const handleRemoveService = (idx) => {
    remove(idx);
  };

  const handlePartChanged = (idx, field, value) => {
    const updatedPart = {
      ...parts[idx],
      [field]: value,
    };
    update(idx, updatedPart);
  };

  const handleServiceChanged = (idx, field, value) => {
    const updatedService = {
      ...serviceItems[idx],
      [field]: value,
    };
    update(idx, updatedService);
  };

  const handleCustomChanged = (idx, field, value) => {
    const updatedCustom = {
      ...customItems[idx],
      [field]: value,
    };
    update(idx, updatedCustom);
  };

  return (
    <Card className={cn(className, "gap-0")} {...props}>
      <Tabs defaultValue="parts" className="contents">
        <CardHeader>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Phụ tùng ({parts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span>Dịch vụ ({serviceItems.length})</span>
            </TabsTrigger>
            <TabsTrigger value="customs" className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              <span>Tùy chỉnh ({customItems.length})</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="parts" className="contents">
          <CardContent className="flex-1">
            {parts.length === 0 ? (
              <EmptyState icon={Package} title="Không có phụ tùng" />
            ) : (
              parts.map((item) => {
                return (
                  <PartItemRow
                    key={item.index}
                    item={item}
                    idx={item.index}
                    disabled={disabled}
                    onPartChanged={handlePartChanged}
                    onRemove={handleRemoveService}
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
          <CardContent className="flex-1">
            {serviceItems.length === 0 ? (
              <EmptyState icon={Wrench} title="Không có dịch vụ" />
            ) : (
              serviceItems.map((item) => {
                return (
                  <ServiceItemRow
                    key={item.index}
                    item={item}
                    idx={item.index}
                    disabled={disabled}
                    onServiceChanged={handleServiceChanged}
                    onRemove={handleRemoveService}
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

        <TabsContent value="customs" className="contents">
          <CardContent className="flex-1">
            {customItems.length === 0 ? (
              <EmptyState icon={Hammer} title="Không có hạng mục tùy chỉnh" />
            ) : (
              customItems.map((item) => {
                return (
                  <CustomItemRow
                    key={item.index}
                    item={item}
                    idx={item.index}
                    disabled={disabled}
                    onCustomChanged={handleCustomChanged}
                    onRemove={handleRemoveService}
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
              onClick={handleAddCustom}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm hạng mục
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

ServiceOrderServices.displayName = "ServiceOrderServices";

export default ServiceOrderServices;
