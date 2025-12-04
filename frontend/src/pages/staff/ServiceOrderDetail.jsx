import Container from "@/components/global/Container";
import { ServiceOrderEditForm } from "@/components/staff/service-order-detail";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense, useState } from "react";
import {
  useLoaderData,
  useParams,
  useRevalidator,
  Await,
  Link,
} from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getServiceOrderById,
  updateServiceOrderItems,
  cancelServiceOrder,
} from "@/api/serviceOrders";
import { createQuote, getQuotesForServiceOrder } from "@/api/quotes";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CountdownTimer from "@/components/global/CountdownTimer";
import { formatDateTime } from "@/lib/utils";

async function loader({ params }) {
  const serviceOrderPromise = getServiceOrderById(params.id);
  
  // Load quotes để hiển thị lý do từ chối
  const quotesPromise = serviceOrderPromise.then(async (serviceOrder) => {
    if (serviceOrder?.id) {
      try {
        const quotesData = await getQuotesForServiceOrder(serviceOrder.id, 1, 100);
        return quotesData;
      } catch (error) {
        console.error("Error loading quotes:", error);
        return null;
      }
    }
    return null;
  });

  return {
    serviceOrder: serviceOrderPromise,
    quotes: quotesPromise,
  };
}

const ServiceOrderDetailContent = ({ serviceOrder, quotes, revalidator }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Tìm quote rejected gần nhất
  const latestRejectedQuote = quotes?.quotes
    ?.filter((q) => q.status === "rejected")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const handleUpdateServiceOrder = async (serviceOrder, items) => {
    try {
      const task = updateServiceOrderItems(serviceOrder.id, items);
      await toast
        .promise(task, {
          loading: "Đang cập nhật lệnh sửa chữa...",
          success: "Cập nhật lệnh sửa chữa thành công",
          error: "Cập nhật lệnh sửa chữa thất bại",
        })
        .unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to update service order items:", error);
    }
  };

  const handleSendInvoice = async (serviceOrderData, items) => {
    try {
      const task = updateServiceOrderItems(serviceOrderData.id, items).then(
        () => {
          return createQuote(serviceOrderData.id);
        }
      );
      await toast
        .promise(task, {
          loading: "Đang cập nhật và gửi báo giá...",
          success: "Gửi báo giá thành công",
          error: (error) => {
            // Xử lý lỗi cụ thể
            if (error?.response?.status === 409) {
              return error?.response?.data?.message || "Đã có báo giá đang chờ phê duyệt. Vui lòng đợi khách hàng phê duyệt hoặc từ chối báo giá hiện tại.";
            }
            return error?.response?.data?.message || "Gửi báo giá thất bại";
          },
        })
        .unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to send invoice:", error);
      // Không cần hiển thị toast nữa vì đã có trong promise
      return;
    }
  };

  const handleCancelServiceOrder = async (serviceOrderData) => {
    setShowCancelDialog(true);
  };

  const confirmCancelServiceOrder = async () => {
    if (!serviceOrder) return;

    setIsCancelling(true);
    try {
      await toast.promise(
        cancelServiceOrder(
          serviceOrder.id,
          cancelReason || "Nhân viên hủy lệnh"
        ),
        {
          loading: "Đang hủy lệnh sửa chữa...",
          success: "Hủy lệnh sửa chữa thành công",
          error: "Hủy lệnh sửa chữa thất bại",
        }
      );
      setShowCancelDialog(false);
      setCancelReason("");
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to cancel service order:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  // giả sử backend trả về serviceOrder.estimatedCompletionTime (ISO) cho thời gian kết thúc dự kiến
  const hasEstimatedTime = !!serviceOrder?.estimatedCompletionTime;

  return (
    <>
      {hasEstimatedTime && (
        <div className="mb-4 flex justify-end">
          <CountdownTimer
            targetTime={serviceOrder.estimatedCompletionTime}
            label="Thời gian còn lại để hoàn thành lệnh"
            compact
          />
        </div>
      )}

      <ServiceOrderEditForm
        serviceOrder={serviceOrder}
        getTotalPrice={async (items) => {
          //TODO: replace this with calls to the server
          const sum = items.reduce((acc, x) => acc + x.price * x.quantity, 0);
          return {
            price: sum,
            tax: sum * 0.1,
            total: 1.1 * sum,
          };
        }}
        onCancelServiceOrder={handleCancelServiceOrder}
        onUpdateServiceOrder={handleUpdateServiceOrder}
        onSendInvoice={handleSendInvoice}
      />

      {/* Hiển thị lý do từ chối nếu có quote rejected */}
      {latestRejectedQuote?.rejectedReason && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-amber-900 mb-1">
                Lý do từ chối báo giá gần nhất
              </h4>
              <p className="text-sm text-amber-800">
                {latestRejectedQuote.rejectedReason}
              </p>
              {latestRejectedQuote.createdAt && (
                <p className="text-xs text-amber-700 mt-2">
                  Từ chối vào: {formatDateTime(latestRejectedQuote.createdAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy lệnh sửa chữa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy lệnh sửa chữa này? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="cancel-reason">Lý do hủy (tùy chọn)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Nhập lý do hủy lệnh..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelServiceOrder}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ServiceOrderDetail = () => {
  const { serviceOrder: serviceOrderPromise, quotes: quotesPromise } = useLoaderData();
  const revalidator = useRevalidator();
  const { id } = useParams();

  return (
    <Container pageContext="admin">
      <BackButton
        to="/staff/service-order"
        label="Quay lại trang quản lý lệnh"
      />
      <div className="flex justify-between">
        <H3>Chi Tiết Lệnh Sửa Chữa</H3>
        <Tabs value="main">
          <TabsList>
            <TabsTrigger value="main">
              <Link to={`/staff/service-order/${id}`}>Thông tin chung</Link>
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <Link to={`/staff/service-order/${id}/quotes`}>Báo giá</Link>
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Link to={`/staff/service-order/${id}/progress`}>
                Tiến trình sửa chữa
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <Await
          resolve={Promise.all([serviceOrderPromise, quotesPromise])}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải thông tin lệnh sửa chữa
            </div>
          }
        >
          {([serviceOrder, quotes]) => (
            <ServiceOrderDetailContent
              serviceOrder={serviceOrder}
              quotes={quotes}
              revalidator={revalidator}
            />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderDetail.loader = loader;

export default ServiceOrderDetail;
