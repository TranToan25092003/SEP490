import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice, cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { useState } from "react";

/** @typedef {import("./index").BookingTotalProps} BookingTotalProps */

/**
 * Summarises pricing details and triggers confirmation actions.
 * @param {BookingTotalProps} props
 */
const BookingTotal = ({
  updateBookingLoading = false,
  disabled = false,
  onUpdateServices,
  getTotalPrice,
  className,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState({
    price: 0,
    tax: 0,
    total: 0
  });

  const { watch } = useFormContext();
  const services = watch("services");

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (typeof getTotalPrice !== "function") return;

      try {
        setLoading(true);

        const price = await getTotalPrice(services);
        if (!ignore) {
          setPrice(price);
          setLoading(false);
        }
      } catch(e) {
        console.log(e);
        setLoading(false);
      }
    })();

    return () => ignore = true;
  }, [services, getTotalPrice]);

  return (
    <Card className={cn(className, "relative")} {...props}>
      <CardHeader>
        <CardTitle>Tổng kết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col flex-1">
        <div className="space-y-3 flex-1">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-semibold">{formatPrice(price.price)}</span>
          </div>
          <div className="flex font-sm text-foreground/60 justify-between">
            <span>Thuế</span>
            <span className="font-semibold">{formatPrice(price.tax)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold text-lg">
            <span>Tổng</span>
            <span>{formatPrice(price.total)}</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            onUpdateServices();
          }}
          disabled={updateBookingLoading || disabled}
          aria-busy={updateBookingLoading}
        >
          Cập nhật thông tin
        </Button>
      </CardContent>

      {loading && (
        <div className="absolute inset-0 bg-white/80 rounded-lg flex flex-col items-center justify-center gap-2">
          <Spinner className="size-6" />
          <span className="text-sm text-muted-foreground">Đang tính giá...</span>
        </div>
      )}
    </Card>
  );
};

BookingTotal.displayName = "BookingTotal";

export default BookingTotal;
