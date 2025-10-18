import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useFieldArray } from "react-hook-form";
import { SelectLabel } from "@radix-ui/react-select";

const services = [
  { sid: "1", name: "Thay dầu", price: 399000 },
  { sid: "2", name: "Kiểm tra phanh", price: 250000 },
  { sid: "3", name: "Bảo dưỡng", price: 799000 },
  { sid: "4", name: "Sửa chữa", price: 1299000 }
];

const BookingServices = ({ className, ...props }) => {
  const {
    fields: serviceItems,
    append,
    update,
    remove
  } = useFieldArray({
    name: "services",
  });

  const handleAddService = () => {
    append({
      ...services[0]
    });
  }

  const handleUpdateService = (idx, sid) => {
    const updatedService = services.find(s => s.sid === sid);
    update(idx, {
      ...updatedService
    });
  }

  const handleRemoveService = (sid) => {
    const idx = serviceItems.findIndex((item) => item.sid === sid);
    remove(idx);
  };

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Dịch vụ / Hạng mục</CardTitle>
      </CardHeader>
      <CardContent>
        {serviceItems.map((service, idx) => (
          <div key={service.id} className="grid grid-cols-4 items-end gap-2">
            <div className="space-y-2 flex-1 col-span-2">
              <label className="text-sm font-medium">Dịch vụ</label>
              <Select
                value={service.sid}
                onValueChange={(sid) => {
                  handleUpdateService(idx, sid);
                }}
              >
                <SelectTrigger className="m-0 w-full">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.sid} value={s.sid}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Giá</label>
              <Input value={formatPrice(service.price)} readOnly />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleRemoveService(service.id)}
            >
              Xóa
            </Button>
          </div>
        ))}

        <Button
          type="button"
          onClick={handleAddService}
          className="w-full mt-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm dịch Vụ
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingServices;
