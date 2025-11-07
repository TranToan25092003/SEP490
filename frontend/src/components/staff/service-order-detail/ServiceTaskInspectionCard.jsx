import { useRevalidator } from "react-router-dom";
import { Card } from "antd";
import { CardContent, CardHeader } from "@/components/ui/card";
import { H4 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { translateTaskStatus } from "@/utils/enumsTranslator";
import StatusBadge from "@/components/global/StatusBadge";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import { beginInspectionTask, completeInspection, updateInspection } from "@/api/serviceTasks";
import InspectionTaskModal from "./InspectionTaskModal";
import ChooseStaffModal from "./ChooseStaffModal";
import EmptyState from "@/components/global/EmptyState";
import { Clock } from "lucide-react";

const ServiceTaskInspectionCard = ({ task }) => {
  const revalidator = useRevalidator();

  function getButton() {
    if (task.status === "scheduled") {
      return <Button onClick={handleStartInspection}>Bắt đầu kiểm tra</Button>;
    } else if (task.status === "in_progress") {
      return <Button onClick={handleCompleteInspection}>Hoàn thành kiểm tra</Button>;
    } else if (task.status === "completed" && task.serviceOrderStatus !== "completed") {
      return <Button onClick={handleEditInspection}>Chỉnh sửa kiểm tra</Button>;
    }
  }

  async function handleEditInspection() {
    try {
      const result = await NiceModal.show(InspectionTaskModal, { taskId: task.id });
      const editInspectionPromise = updateInspection(task.id, {
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image"
        }))
      });

      await toast.promise(editInspectionPromise, {
        loading: "Đang cập nhật kiểm tra...",
        success: "Cập nhật kiểm tra thành công!",
        error: "Cập nhật kiểm tra thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection edit cancelled or failed:", error);
    }
  }

  async function handleStartInspection() {
    try {
      const technician = await NiceModal.show(ChooseStaffModal);

      const startPromise = beginInspectionTask(task.id, [
        {
          technicianClerkId: technician.technicianClerkId,
          role: "lead"
        }
      ]);

      await toast.promise(startPromise, {
        loading: "Đang bắt đầu kiểm tra...",
        success: "Bắt đầu kiểm tra thành công!",
        error: "Bắt đầu kiểm tra thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection start cancelled or failed:", error);
    }
  }

  async function handleCompleteInspection() {
    try {
      const result = await NiceModal.show(InspectionTaskModal);
      const completeInspectionPromise = completeInspection(task.id, {
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image"
        }))
      });

      await toast.promise(completeInspectionPromise, {
        loading: "Đang hoàn thành kiểm tra...",
        success: "Hoàn thành kiểm tra thành công!",
        error: "Hoàn thành kiểm tra thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection cancelled or failed:", error);
    }
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center px-2">
        <H4>Kiểm tra xe</H4>
        {getButton()}
      </CardHeader>
      <CardContent className="px-2">
        <div className="mb-2 text-sm text-muted-foreground">
          Trạng thái: <StatusBadge status={translateTaskStatus(task.status)} />
        </div>
        <p className="mb-4">{task.comment}</p>
        {task.media && task.media.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {task.media.map((mediaItem) => (
              <img
                key={mediaItem.url}
                src={mediaItem.url}
                alt={`Media Item`}
                className="w-full h-auto rounded-md object-cover"
              />
            ))}
          </div>
        )}
        {task.status === "in_progress" && (
          <EmptyState
            icon={Clock}
            title="Đang chờ kiểm tra"
            subtitle="Khi hoàn tất, nhấn nút hoàn thành kiểm tra để cập nhật trạng thái"
          />
        )}

        {task.status === "scheduled" && (
          <EmptyState
            icon={Clock}
            title="Chưa bắt đầu kiểm tra"
            subtitle="Vui lòng thực hiện bằng nút bên trên"
          />
        )}
      </CardContent>
    </Card>
  );
}

export default ServiceTaskInspectionCard;
