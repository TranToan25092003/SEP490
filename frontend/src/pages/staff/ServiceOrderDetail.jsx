import Container from "@/components/global/Container";
import {
  ServiceOrderEditForm
} from "@/components/staff/service-order-detail";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";

/**
 * ServiceOrderDetail Component
 * Page for viewing and editing service order details
 * @component
 * @returns {JSX.Element} The service order detail page
 */
const ServiceOrderDetail = () => {
  const serviceOrder = {
    id: "WO-DRAFT-0007",
    customerName: "Nguyễn Văn A",
    licensePlate: "59f-123.45- Altis 2019",
    vehicleModel: "Altis 2019",
    fixTechnician: { id: "1", name: "Nguyễn Văn A" },
    bayInfo: { id: "B1", name: "Bay 1", isFinal: false },
    services: [
      { sid: "1", name: "Thay dầu", basePrice: 399000 },
      { sid: "2", name: "Kiểm tra phanh", basePrice: 250000 }
    ],
    comment: ""
  };

  /**
   * Handle updating service order
   * @async
   * @param {Object} updatedData - The updated service order data
   * @returns {Promise<void>}
   */
  const handleUpdateServiceOrder = async (updatedData) => {
    await new Promise((resolve, _) => setTimeout(resolve, 4000));
    console.log("Updating service order:", updatedData);
  };

  /**
   * Handle confirming service order
   * @async
   * @param {Object} serviceOrderData - The service order data to confirm
   * @returns {Promise<void>}
   */
  const handleConfirmServiceOrder = async (serviceOrderData) => {
    await new Promise((resolve, _) => setTimeout(resolve, 4000));
    console.log("Confirming service order:", serviceOrderData);
  };

  /**
   * Handle sending invoice for service order
   * @async
   * @param {Object} serviceOrderData - The service order data
   * @returns {Promise<void>}
   */
  const handleSendInvoice = async (serviceOrderData) => {
    await new Promise((resolve, _) => setTimeout(resolve, 2000));
    console.log("Sending invoice for service order:", serviceOrderData);
  }

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/service-order" label="Quay lại trang quản lý lệnh" />
      <H3>Chi Tiết Lệnh Sửa Chữa</H3>

      <ServiceOrderEditForm
        serviceOrder={serviceOrder}
        getTotalPrice={async (services) => {
          await new Promise((resolve, _) => setTimeout(resolve, 500));
          const sum = services.reduce((acc, x) => acc + x.basePrice, 0);
          return {
            price: sum,
            tax: sum * 0.1,
            total: 1.1 * sum
          };
        }}
        onConfirmServiceOrder={handleConfirmServiceOrder}
        onUpdateServiceOrder={handleUpdateServiceOrder}
        onSendInvoice={handleSendInvoice}
      />
    </Container>
  );
};

export default ServiceOrderDetail;
