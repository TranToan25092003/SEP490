import BackButton from "@/components/global/BackButton";
import Container from "@/components/global/Container";
import { ServiceOrderAddForm } from "@/components/staff/service-order-add";
import { H3 } from "@/components/ui/headings";
import { getServices } from "@/api/services";
import { createWalkInServiceOrder } from "@/api/serviceOrders";
import { useLoaderData, useNavigate } from "react-router-dom";
import { toast } from "sonner";

async function loader() {
  const services = await getServices();
  const normalizedServices = Array.isArray(services)
    ? services.map((service) => {
        const rawId = service.id;
        let normalizedId = rawId;

        if (rawId && typeof rawId === "object") {
          normalizedId =
            rawId.$oid ||
            rawId._id ||
            rawId.id ||
            (typeof rawId.toString === "function" ? rawId.toString() : null);
        }

        if (normalizedId == null) {
          normalizedId = "";
        }

        return {
          ...service,
          id: String(normalizedId),
        };
      })
    : [];

  return { services: normalizedServices };
}

const ServiceOrderAdd = () => {
  const loaderData = useLoaderData() || {};
  const services = loaderData.services || [];
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        licensePlate: formData.licensePlate,
        serviceIds: formData.serviceIds,
        note: formData.note,
      };

      const task = createWalkInServiceOrder(payload);
      const serviceOrder = await toast
        .promise(task, {
          loading: "Đang tạo lệnh sửa chữa...",
          success: "Tạo lệnh thành công",
          error: "Không thể tạo lệnh sửa chữa",
        })
        .unwrap();

      if (serviceOrder?.id) {
        navigate(`/staff/service-order/${serviceOrder.id}`);
      }
    } catch (error) {
      console.error("Failed to create service order:", error);
    }
  };

  return (
    <Container pageContext="admin">
      <BackButton
        to="/staff/service-order"
        label="Quay lại trang quản lý lệnh"
      />
      <H3>Thêm Lệnh Sửa Chữa Mới</H3>

      <ServiceOrderAddForm services={services || []} onSubmit={handleSubmit} />
    </Container>
  );
};

ServiceOrderAdd.displayName = "ServiceOrderAdd";
ServiceOrderAdd.loader = loader;

export default ServiceOrderAdd;
