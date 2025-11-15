import Container from "@/components/global/Container";
import {
  ServiceOrderEditForm
} from "@/components/staff/service-order-detail";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense } from "react";
import { useLoaderData, useParams, useRevalidator, Await, Link } from "react-router-dom";
import { getServiceOrderById, updateServiceOrderItems } from "@/api/serviceOrders";
import { createQuote } from "@/api/quotes";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import NiceModal from "@ebay/nice-modal-react";
import ChooseStaffModal from "@/components/staff/service-order-detail/ChooseStaffModal";
import { beginInspectionTask, scheduleInspection } from "@/api/serviceTasks";

function loader({ params }) {
  return {
    serviceOrder: getServiceOrderById(params.id),
  };
}

const ServiceOrderDetailContent = ({ serviceOrder, revalidator }) => {
  const handleUpdateServiceOrder = async (serviceOrder, items) => {
    try {
      const task = updateServiceOrderItems(serviceOrder.id, items);
      await toast.promise(task, {
        loading: "Đang cập nhật lệnh sửa chữa...",
        success: "Cập nhật lệnh sửa chữa thành công",
        error: "Cập nhật lệnh sửa chữa thất bại"
      }).unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to update service order items:", error);
    }
  };



  const handleSendInvoice = async (serviceOrderData, items) => {
    try {
      const task = updateServiceOrderItems(serviceOrderData.id, items).then(() => {
        createQuote(serviceOrderData.id);
      });
      await toast.promise(task, {
        loading: "Đang cập nhật và gửi báo giá...",
        success: "Gửi báo giá thành công",
        error: "Gửi báo giá thất bại"
      }).unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to send invoice:", error);
      return;
    }
  };

  const handleCancelServiceOrder = async (serviceOrderData) => {
    toast.error("This feature is not implemented");
  };

  return (
    <ServiceOrderEditForm
      serviceOrder={serviceOrder}
      getTotalPrice={async (items) => {
        //TODO: replace this with calls to the server
        const sum = items.reduce((acc, x) => acc + x.price * x.quantity, 0);
        return {
          price: sum,
          tax: sum * 0.1,
          total: 1.1 * sum
        };
      }}
      onCancelServiceOrder={handleCancelServiceOrder}
      onUpdateServiceOrder={handleUpdateServiceOrder}
      onSendInvoice={handleSendInvoice}
    />
  );
};

const ServiceOrderDetail = () => {
  const { serviceOrder } = useLoaderData();
  const revalidator = useRevalidator();
  const { id } = useParams();

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/service-order" label="Quay lại trang quản lý lệnh" />
      <div className="flex justify-between">
        <H3>Chi Tiết Lệnh Sửa Chữa</H3>
        <Tabs value="main">
          <TabsList>
            <TabsTrigger value="main">
              <Link to={`/staff/service-order/${id}`}>
                Thông tin chung
              </Link>
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <Link to={`/staff/service-order/${id}/quotes`}>
                Báo giá
              </Link>
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Link to={`/staff/service-order/${id}/progress`}>
                Tiến trình sửa chữa
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      }>
        <Await
          resolve={serviceOrder}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải thông tin lệnh sửa chữa
            </div>
          }
        >
          {(data) => (
            <ServiceOrderDetailContent serviceOrder={data} revalidator={revalidator} />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderDetail.loader = loader;

export default ServiceOrderDetail;
