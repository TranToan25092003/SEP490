import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";

const BookingTotal = ({
  subtotal = 659000,
  taxRate = 0.1,
  onUpdateServices,
  className,
  ...props
}) => {
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>Tổng kết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col flex-1">
        <div className="space-y-3 flex-1">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex font-sm text-foreground/60 justify-between">
            <span>Thuế</span>
            <span className="font-semibold">{formatPrice(tax)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Button onClick={onUpdateServices}>
          Cập nhật thông tin
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingTotal;
