import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice, cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";
import { useServiceOrder } from "./ServiceOrderContext";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ServiceOrderTotal = ({ className, ...props }) => {
  const {
    disabled,
    serviceOrder,
    getTotalPrice,
    handleUpdateServiceOrder,
    handleSendInvoice,
    hasPendingQuote = false,
  } = useServiceOrder();
  const [loading, setLoading] = useState(false);
  const [showSendQuoteDialog, setShowSendQuoteDialog] = useState(false);
  const [price, setPrice] = useState({
    price: 0,
    tax: 0,
    total: 0,
  });

  const { watch, subscribe } = useFormContext();
  const items = watch();
  const hasServices = items.services.length + items.parts.length > 0;
  const debounced = useDebouncedCallback((fn) => fn(), 1000);

  useEffect(() => {
    let ignore = false;

    const fetchPrice = async (values) => {
      if (typeof getTotalPrice !== "function") return;

      try {
        setLoading(true);

        const price = await getTotalPrice(values);
        if (!ignore) {
          setPrice(price);
          setLoading(false);
        }
      } catch (e) {
        console.log(e);
        setLoading(false);
      }
    };

    const unsub = subscribe({
      formState: {
        values: true,
        isValid: true,
      },
      callback: ({ values, isValid }) => {
        if (isValid) {
          debounced(() => fetchPrice([...values.services, ...values.parts]));
        }
      },
    });

    fetchPrice([...items.services, ...items.parts]);

    return () => {
      unsub();
      ignore = true;
    };
  }, [subscribe, getTotalPrice]);

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

        {serviceOrder.status !== "completed" &&
          serviceOrder.status !== "cancelled" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleUpdateServiceOrder(serviceOrder, [
                  ...items.services,
                  ...items.parts,
                ]);
              }}
              disabled={
                disabled ||
                !hasServices ||
                hasPendingQuote ||
                serviceOrder.status === "waiting_customer_approval"
              }
              aria-busy={disabled || !hasServices}
              title={
                hasPendingQuote ||
                serviceOrder.status === "waiting_customer_approval"
                  ? "Không thể cập nhật khi đã gửi báo giá. Vui lòng đợi khách hàng phê duyệt hoặc từ chối báo giá hiện tại."
                  : undefined
              }
            >
              Cập nhật thông tin
            </Button>
          )}

        {serviceOrder.status !== "completed" &&
          serviceOrder.status !== "cancelled" && (
            <Button
              className="w-full"
              type="button"
              onClick={() => {
                setShowSendQuoteDialog(true);
              }}
              disabled={
                serviceOrder.status !== "inspection_completed" ||
                !hasServices ||
                disabled ||
                hasPendingQuote ||
                serviceOrder.status === "waiting_customer_approval"
              }
              aria-busy={disabled || !hasServices}
              title={
                hasPendingQuote ||
                serviceOrder.status === "waiting_customer_approval"
                  ? "Không thể gửi báo giá khi đã có báo giá đang chờ phê duyệt. Vui lòng đợi khách hàng phê duyệt hoặc từ chối báo giá hiện tại."
                  : undefined
              }
            >
              Gửi báo giá
            </Button>
          )}
      </CardContent>

      {loading && (
        <div className="absolute inset-0 bg-white/80 rounded-lg flex flex-col items-center justify-center gap-2">
          <Spinner className="size-6" />
          <span className="text-sm text-muted-foreground">
            Đang tính giá...
          </span>
        </div>
      )}

      <AlertDialog
        open={showSendQuoteDialog}
        onOpenChange={setShowSendQuoteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi báo giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn gửi báo giá này cho khách hàng? Sau khi gửi,
              bạn sẽ không thể cập nhật thông tin cho đến khi khách hàng phê
              duyệt hoặc từ chối báo giá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabled}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleSendInvoice(serviceOrder, [
                  ...items.services,
                  ...items.parts,
                ]);
                setShowSendQuoteDialog(false);
              }}
              disabled={disabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {disabled ? "Đang gửi..." : "Xác nhận gửi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

ServiceOrderTotal.displayName = "ServiceOrderTotal";

export default ServiceOrderTotal;
