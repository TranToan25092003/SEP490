import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense, useState } from "react";
import { useLoaderData, useParams, Await, Link, useRevalidator } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getAllTasksForServiceOrder, scheduleInspection, scheduleService } from "@/api/serviceTasks";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Wrench, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import EmptyState from "@/components/global/EmptyState";
import ServiceTaskInspectionCard from "@/components/staff/service-order-detail/ServiceTaskInspectionCard";
import ServiceTaskServicingCard from "@/components/staff/service-order-detail/ServiceTaskServicingCard";
import BaySchedulingModal from "@/components/staff/service-order-detail/BaySchedulingModal";

function loader({ params }) {
  return {
    tasks: getAllTasksForServiceOrder(params.id),
  };
}

const ServiceOrderDetailContent = ({ tasks }) => {
  const [activeTab, setActiveTab] = useState("inspection");
  const { id } = useParams();
  const revalidator = useRevalidator();

  const inspectionTasks = tasks.filter((task) => task.__t === "inspection");
  const serviceTasks = tasks.filter((task) => task.__t === "servicing");

  const handleScheduleService = async () => {
    try {
      const { bay, slot } = await NiceModal.show(BaySchedulingModal);

      const task = scheduleService(id, bay.id, slot.start, slot.end);

      await toast.promise(task, {
        loading: "Đang lên lịch sửa chữa...",
        success: "Lên lịch sửa chữa thành công!",
        error: "Lên lịch sửa chữa thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Service scheduling cancelled or failed:", error);
    }
  }

  const handleScheduleInspection = async () => {
    try {
      const { bay, slot } = await NiceModal.show(BaySchedulingModal);

      const task = scheduleInspection(id, bay.id, slot.start, slot.end);

      await toast.promise(task, {
        loading: "Đang lên lịch kiểm tra...",
        success: "Lên lịch kiểm tra thành công!",
        error: "Lên lịch kiểm tra thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection scheduling cancelled or failed:", error);
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="gap-2 flex-row"
    >
      <TabsList className="flex flex-col h-auto items-stretch self-start gap-2">
        <TabsTrigger
          value="inspection"
          className="cursor-pointer justify-start p-5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Kiểm tra xe</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="service"
          className="cursor-pointer justify-start p-5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            <span>Sửa chữa</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inspection" className="mt-0">
        {inspectionTasks?.map((task) => (
          <ServiceTaskInspectionCard key={task._id} task={task} />
        ))}

        {inspectionTasks.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="Chưa lên lịch kiểm tra"
            subtitle="Vui lòng thực hiện ở bên dưới"
          >
            <Button onClick={handleScheduleInspection}>
              Lên lịch kiểm tra
            </Button>
          </EmptyState>
        )}
      </TabsContent>

      <TabsContent value="service" className="mt-0">
        {serviceTasks?.map((task) => (
          <ServiceTaskServicingCard key={task._id} task={task} />
        ))}

        {serviceTasks.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="Chưa lên lịch sửa chữa"
            subtitle="Vui lòng thực hiện ở bên dưới"
          >
            <Button onClick={handleScheduleService}>
              Lên lịch sửa chữa
            </Button>
          </EmptyState>
        )}
      </TabsContent>
    </Tabs>
  );
};

const ServiceOrderDetail = () => {
  const { tasks } = useLoaderData();
  const { id } = useParams();

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/service-order" label="Quay lại trang quản lý lệnh" />
      <div className="flex justify-between">
        <H3>Chi Tiết Lệnh Sửa Chữa</H3>
        <Tabs value="progress">
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
          resolve={tasks}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải tiến trình
            </div>
          }
        >
          {(data) => (
            <ServiceOrderDetailContent tasks={data} />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderDetail.loader = loader;

export default ServiceOrderDetail;
