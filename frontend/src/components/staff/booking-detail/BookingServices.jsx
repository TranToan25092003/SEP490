import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Package } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useFieldArray } from "react-hook-form";

/** @typedef {import("./index").BookingServicesProps} BookingServicesProps */
/** @typedef {import("./index").ServiceInfo} ServiceInfo */

/** @type {ServiceInfo[]} */
const serviceOptions = [
  { sid: "1", name: "Thay dầu", basePrice: 399000 },
  { sid: "2", name: "Kiểm tra phanh", basePrice: 250000 },
  { sid: "3", name: "Bảo dưỡng", basePrice: 799000 },
  { sid: "4", name: "Sửa chữa", basePrice: 1299000 },
];

/**
 * Manages the services field array within the booking detail form.
 * @param {BookingServicesProps} props
 */
const BookingServices = ({ disabled = false, className, ...props }) => {
  const {
    fields: serviceItems,
    append,
    update,
    remove,
  } = useFieldArray({
    name: "services",
  });

  const handleAddService = () => {
    if (!serviceOptions.length) return;
    append({ ...serviceOptions[0] });
  };

  /**
   * @param {number} index
   * @param {string} sid
   */
  const handleUpdateService = (index, sid) => {
    const updatedService = serviceOptions.find((s) => s.sid === sid);
    if (!updatedService) return;
    update(index, { ...updatedService });
  };

  /**
   * @param {string} fieldId
   */
  const handleRemoveService = (fieldId) => {
    const index = serviceItems.findIndex((item) => item.id === fieldId);
    if (index !== -1) {
      remove(index);
    }
  };

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Dịch vụ / Hạng mục {serviceItems.length > 0 ? `(${serviceItems.length})` : '' }</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[200px] overflow-y-auto">
        {serviceItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Không có dịch vụ nào</p>
            <p className="text-sm text-muted-foreground/75 mb-4">Nhấn nút bên dưới để thêm dịch vụ</p>
          </div>
        ) : (
          <>
            {serviceItems.map((service, idx) => (
              <div key={service.id} className="grid grid-cols-4 items-end gap-2">
                <div className="space-y-2 flex-1 col-span-2">
                  <label className="text-sm font-medium">Dịch vụ</label>
                  <Select
                    value={service.sid}
                    onValueChange={(sid) => handleUpdateService(idx, sid)}
                  >
                    <SelectTrigger className="m-0 w-full">
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((option) => (
                        <SelectItem key={option.sid} value={option.sid}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Giá</label>
                  <Input value={formatPrice(service.basePrice ?? 0)} readOnly />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => handleRemoveService(service.id)}
                >
                  Xóa
                </Button>
              </div>
            ))}
          </>
        )}

      </CardContent>
      <CardFooter>
        <Button type="button" onClick={handleAddService} disabled={disabled} className="w-full mt-3">
          <Plus className="w-4 h-4 mr-2" />
          Thêm dịch vụ
        </Button>
      </CardFooter>
    </Card>
  );
};

BookingServices.displayName = "BookingServices";

export default BookingServices;
