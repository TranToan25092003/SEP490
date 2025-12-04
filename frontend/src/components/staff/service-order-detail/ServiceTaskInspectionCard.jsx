import { useState } from "react";
import { useRevalidator } from "react-router-dom";
import { Card } from "antd";
import { CardContent, CardHeader } from "@/components/ui/card";
import { H4 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { translateTaskStatus } from "@/utils/enumsTranslator";
import { formatDateTime } from "@/lib/utils";
import StatusBadge from "@/components/global/StatusBadge";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import {
  beginInspectionTask,
  completeInspection,
  updateInspection,
  rescheduleTask,
} from "@/api/serviceTasks";
import InspectionTaskModal from "./InspectionTaskModal";
import ChooseStaffModal from "./ChooseStaffModal";
import EmptyState from "@/components/global/EmptyState";
import { Clock } from "lucide-react";
import BaySchedulingModal from "./BaySchedulingModal";
import CountdownTimer from "@/components/global/CountdownTimer";

const ServiceTaskInspectionCard = ({ task }) => {
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();

  function getButton() {
    if (task.status === "scheduled" || task.status === "rescheduled") {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleChangeSchedule}
            disabled={loading}
          >
            {task.status === "scheduled" ? "Thay đổi lịch" : "Dời lại lần nữa"}
          </Button>
          <Button disabled={loading} onClick={handleStartInspection}>
            {task.status === "scheduled"
              ? "Bắt đầu kiểm tra"
              : "Tiếp tục kiểm tra"}
          </Button>
        </div>
      );
    } else if (task.status === "in_progress") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleChangeSchedule}
            disabled={loading}
          >
            Dời lịch kiểm tra
          </Button>
          <Button disabled={loading} onClick={handleCompleteInspection}>
            Hoàn thành kiểm tra
          </Button>
        </div>
      );
    } else if (
      task.status === "completed" &&
      task.serviceOrderStatus !== "completed"
    ) {
      return <Button onClick={handleEditInspection}>Chỉnh sửa kiểm tra</Button>;
    }
  }

  async function handleChangeSchedule() {
    try {
      setLoading(true);
      const { bay, slot } = await NiceModal.show(BaySchedulingModal, { task });

      const promise = rescheduleTask(task.id, bay.id, slot.start, slot.end);

      await toast
        .promise(promise, {
          loading: "Đang thay đổi lịch...",
          success: "Thay đổi lịch thành công!",
          error: "Thay đổi lịch thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Rescheduling failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditInspection() {
    try {
      const result = await NiceModal.show(InspectionTaskModal, {
        taskId: task.id,
      });
      const editInspectionPromise = updateInspection(task.id, {
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image",
        })),
      });

      await toast
        .promise(editInspectionPromise, {
          loading: "Đang cập nhật kiểm tra...",
          success: "Cập nhật kiểm tra thành công!",
          error: "Cập nhật kiểm tra thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection edit cancelled or failed:", error);
    }
  }

  async function handleStartInspection() {
    try {
      setLoading(true);
      const technician = await NiceModal.show(ChooseStaffModal);

      const startPromise = beginInspectionTask(task.id, [
        {
          technicianClerkId: technician.technicianClerkId,
          role: "lead",
        },
      ]);

      await toast
        .promise(startPromise, {
          loading: "Đang bắt đầu kiểm tra...",
          success: "Bắt đầu kiểm tra thành công!",
          error: "Bắt đầu kiểm tra thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection start cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteInspection() {
    try {
      setLoading(true);
      const result = await NiceModal.show(InspectionTaskModal);
      const completeInspectionPromise = completeInspection(task.id, {
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image",
        })),
      });

      await toast
        .promise(completeInspectionPromise, {
          loading: "Đang hoàn thành kiểm tra...",
          // success: "Hoàn thành kiểm tra thành công!",
          error: "Hoàn thành kiểm tra thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Inspection cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center px-2">
        <H4>Kiểm tra xe</H4>
        {getButton()}
      </CardHeader>
      <CardContent className="px-2">
        <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Trạng thái:</span>
          <StatusBadge
            status={translateTaskStatus(task.status)}
            colorKey={task.status === "rescheduled" ? "rescheduled" : undefined}
          />
          {task.status === "in_progress" && task.expectedEndTime && (
            <CountdownTimer
              targetTime={task.expectedEndTime}
              label="Còn lại"
              compact
            />
          )}
        </div>
        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
          {task.expectedStartTime && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Thời gian bắt đầu dự kiến:</span>
              <span>{formatDateTime(task.expectedStartTime)}</span>
            </div>
          )}
          {task.expectedEndTime && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Thời gian kết thúc dự kiến:</span>
              <span>{formatDateTime(task.expectedEndTime)}</span>
            </div>
          )}

          {task.actualStartTime && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Thời gian bắt đầu thực tế:</span>
              <span>{formatDateTime(task.actualStartTime)}</span>
            </div>
          )}
          {task.actualEndTime && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Thời gian kết thúc thực tế:</span>
              <span>{formatDateTime(task.actualEndTime)}</span>
            </div>
          )}
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

        {(task.status === "scheduled" || task.status === "rescheduled") && (
          <EmptyState
            icon={Clock}
            title={
              task.status === "rescheduled"
                ? "Đã dời lịch kiểm tra"
                : "Chưa bắt đầu kiểm tra"
            }
            subtitle="Vui lòng thực hiện bằng nút bên trên"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceTaskInspectionCard;
