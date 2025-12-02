import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import BayAvailabilityTab from "@/components/staff/service-order-detail/BayAvailabilityTab";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

const StaffBayStatusPage = () => {
  return (
    <Container pageContext="admin">
      <div className="flex flex-col gap-2 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Tình trạng bay</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between gap-4">
          <div>
            <H3>Tình trạng bay</H3>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi bay nào đang rảnh, đang được sử dụng và lịch sắp tới theo thời gian thực.
            </p>
          </div>
        </div>
      </div>
      <BayAvailabilityTab />
    </Container>
  );
};

export default StaffBayStatusPage;





