import BackButton from "@/components/global/BackButton";
import Container from "@/components/global/Container";
import { ServiceOrderAddForm } from "@/components/staff/service-order-add";
import { H3 } from "@/components/ui/headings";

/**
 * ServiceOrderAdd Component
 * Page for adding a new service order
 * @component
 * @returns {JSX.Element} The service order add page
 */
const ServiceOrderAdd = () => {
  return (
    <Container pageContext="admin">
      <BackButton to="/staff/service-order" label="Quay lại trang quản lý lệnh" />
      <H3>Thêm Lệnh Sửa Chữa Mới</H3>

      <ServiceOrderAddForm
        services={[
          { sid: "1", name: "Thay dầu", basePrice: 399000, description: "" },
          { sid: "2", name: "Kiểm tra phanh", basePrice: 250000, description: "" },
          { sid: "3", name: "Vệ sinh nội thất", basePrice: 150000, description: "" },
        ]}
        onSubmit={async (data) => {
          console.log(data);
        }}
      />
    </Container>
  );
};

ServiceOrderAdd.displayName = "ServiceOrderAdd";

export default ServiceOrderAdd;
