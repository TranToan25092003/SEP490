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
  completeService,
  startService,
  updateServiceTaskTimeline,
  updateServiceTaskTimelineEntry,
  rescheduleTask
} from "@/api/serviceTasks";
import ServiceTaskAddModal from "./ServiceTaskAddModal";
import ServiceTaskTimeline from "./ServiceTaskTimeline";
import ChooseStaffModal from "./ChooseStaffModal";
import { Clock, Image } from "lucide-react";
import EmptyState from "@/components/global/EmptyState";
import BaySchedulingModal from "./BaySchedulingModal";

const ServiceTaskServicingCard = ({ task }) => {
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();

  function getButton() {
    if (task.status === "scheduled") {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleChangeSchedule} disabled={loading}>
            Thay đổi lịch
          </Button>
          <Button disabled={loading} onClick={handleStartService}>
            Bắt đầu sửa chữa
          </Button>
        </div>
      );
    } else if (task.status === "in_progress") {
      return (
        <div className="space-x-2">
          <Button
            disabled={loading}
            onClick={handleUpdateTimeline}
            variant="outline"
          >
            Cập nhật tiến độ
          </Button>
          <Button disabled={loading} onClick={handleCompleteService}>
            Hoàn thành sửa chữa
          </Button>
        </div>
      );
    } else if (task.status === "completed") {
      return null;
    }
  }

  async function handleChangeSchedule() {
    try {
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
    }
  }

  const handleCompleteService = async () => {
    try {
      setLoading(true);

      const completePromise = completeService(task.id);
      await toast
        .promise(completePromise, {
          loading: "Đang hoàn thành sửa chữa...",
          success: "Hoàn thành sửa chữa thành công!",
          error: "Hoàn thành sửa chữa thất bại.",
        })
        .unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.log("Service completion cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTimeline = async () => {
    try {
      setLoading(true);
      const result = await NiceModal.show(ServiceTaskAddModal);
      const updatePromise = updateServiceTaskTimeline(task.id, {
        title: result.title,
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image",
        })),
      });

      await toast
        .promise(updatePromise, {
          loading: "Đang cập nhật tiến độ...",
          success: "Cập nhật tiến độ thành công!",
          error: "Cập nhật tiến độ thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Timeline update cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimelineEntry = async (entry) => {
    try {
      setLoading(true);
      console.log(entry, task);
      const result = await NiceModal.show(ServiceTaskAddModal, {
        entryId: entry.id,
        taskId: task.id,
      });
      const updatePromise = updateServiceTaskTimelineEntry(task.id, entry.id, {
        title: result.title,
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image",
        })),
      });

      await toast
        .promise(updatePromise, {
          loading: "Đang cập nhật mục tiến độ...",
          success: "Cập nhật mục tiến độ thành công!",
          error: "Cập nhật mục tiến độ thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Timeline entry update cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async () => {
    try {
      setLoading(true);
      const technician = await NiceModal.show(ChooseStaffModal);

      const startPromise = startService(task.id, [
        {
          technicianClerkId: technician.technicianClerkId,
          role: "lead",
        },
      ]);

      await toast
        .promise(startPromise, {
          loading: "Đang bắt đầu sửa chữa...",
          success: "Bắt đầu sửa chữa thành công!",
          error: "Bắt đầu sửa chữa thất bại.",
        })
        .unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Service start cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="px-2 flex justify-between items-center">
        <H4>Sửa chữa</H4>
        {getButton()}
      </CardHeader>
      <CardContent className="px-2">
        <div className="mb-2 text-sm text-muted-foreground">
          Trạng thái: <StatusBadge status={translateTaskStatus(task.status)} />
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
        <ServiceTaskTimeline
          task={task}
          timeline={task.timeline}
          onEditEntry={handleEditTimelineEntry}
        />
        {task.status === "scheduled" && (
          <EmptyState
            icon={Clock}
            title="Chưa bắt đầu sửa chữa"
            subtitle="Vui lòng thực hiện bằng nút bên trên"
          />
        )}
        {task.status === "in_progress" && task.timeline.length === 0 && (
          <EmptyState
            icon={Image}
            title="Chưa có tiến độ sửa chữa"
            subtitle="Vui lòng cập nhật tiến độ sửa chữa bằng nút bên trên"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceTaskServicingCard;
