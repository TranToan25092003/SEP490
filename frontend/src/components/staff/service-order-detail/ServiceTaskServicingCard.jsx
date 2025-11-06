import { useState } from "react";
import { useRevalidator } from "react-router-dom";
import { Card } from "antd";
import { CardContent, CardHeader } from "@/components/ui/card";
import { H4 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { translateTaskStatus } from "@/utils/enumsTranslator";
import StatusBadge from "@/components/global/StatusBadge";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import { completeService, startService, updateServiceTaskTimeline } from "@/api/serviceTasks";
import ServiceTaskAddModal from "./ServiceTaskAddModal";
import ServiceTaskTimeline from "./ServiceTaskTimeline";
import ChooseStaffModal from "./ChooseStaffModal";

const ServiceTaskServicingCard = ({ task }) => {
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();

  function getButton() {
    if (task.status === "scheduled") {
      return <Button disabled={loading} onClick={handleStartService}>Bắt đầu sửa chữa</Button>;
    } else if (task.status === "in_progress") {
      return (
        <div className="space-x-2">
          <Button disabled={loading} onClick={handleUpdateTimeline} variant="outline">Cập nhật tiến độ</Button>
          <Button disabled={loading} onClick={handleCompleteService}>Hoàn thành sửa chữa</Button>
        </div>
      )
    } else if (task.status === "completed") {
      return null;
    }
  }

  const handleCompleteService = async () => {
    try {
      setLoading(true);

      const completePromise = completeService(task._id);
      await toast.promise(completePromise, {
        loading: "Đang hoàn thành sửa chữa...",
        success: "Hoàn thành sửa chữa thành công!",
        error: "Hoàn thành sửa chữa thất bại.",
      }).unwrap();
      revalidator.revalidate();
    } catch (error) {
      console.log("Service completion cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateTimeline = async () => {
    try {
      setLoading(true);
      const result = await NiceModal.show(ServiceTaskAddModal);
      const updatePromise = updateServiceTaskTimeline(task._id, {
        title: result.title,
        comment: result.comment,
        media: result.media.map((item) => ({
          publicId: item.publicId,
          url: item.url,
          kind: "image",
        })),
      });

      await toast.promise(updatePromise, {
        loading: "Đang cập nhật tiến độ...",
        success: "Cập nhật tiến độ thành công!",
        error: "Cập nhật tiến độ thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Timeline update cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleStartService = async () => {
    try {
      setLoading(true);
      const technician = await NiceModal.show(ChooseStaffModal);

      const startPromise = startService(task._id, [
        {
          technicianClerkId: technician.technicianClerkId,
          role: "lead"
        }
      ]);

      await toast.promise(startPromise, {
        loading: "Đang bắt đầu sửa chữa...",
        success: "Bắt đầu sửa chữa thành công!",
        error: "Bắt đầu sửa chữa thất bại.",
      }).unwrap();

      revalidator.revalidate();
    } catch (error) {
      console.log("Service start cancelled or failed:", error);
    } finally {
      setLoading(false);
    }
  }

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
        <ServiceTaskTimeline timeline={task.timeline} />
      </CardContent>
    </Card>
  );
}

export default ServiceTaskServicingCard;
