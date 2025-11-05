import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter
} from "@/components/ui/dialog";
import { Suspense, useState } from "react";
import { useLoaderData, useParams, Await, Link, useRevalidator } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, Circle, Wrench, ClipboardCheck } from "lucide-react";
import { uploadImageToFolderWithProgress } from "@/utils/uploadCloudinary";
import { completeInspection, completeService, getAllTasksForServiceOrder, scheduleService, startService, updateServiceTaskTimeline } from "@/api/serviceTasks";
import NiceModal from "@ebay/nice-modal-react";
import { useModal } from "@ebay/nice-modal-react";
import { Card } from "antd";
import { CardContent, CardHeader } from "@/components/ui/card";
import { H4 } from "@/components/ui/headings";
import { translateTaskStatus } from "@/utils/enumsTranslator";
import StatusBadge from "@/components/global/StatusBadge";
import { toast } from "sonner";
import EmptyState from "@/components/global/EmptyState";
import ChooseStaffModal from "@/components/staff/service-order-detail/ChooseStaffModal";
import { formatDateTime } from "@/lib/utils";

function loader({ params }) {
  return {
    tasks: getAllTasksForServiceOrder(params.id),
  };
}

const inspectionFormSchema = z.object({
  comment: z.string().min(1, "Vui lòng nhập nhận xét"),
  media: z.array(z.any()).default([]),
});

const timelineEntrySchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  comment: z.string().min(1, "Vui lòng nhập mô tả"),
  media: z.array(z.any()).default([]),
});

const MEDIA_FOLDER = "service_tasks_content";

const InspectionTaskModal = NiceModal.create(() => {
  const modal = useModal();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      comment: "",
      media: [],
    },
  });

  const onSubmit = async (data) => {
    modal.resolve(data);
    modal.hide();
  };

  const handleCancel = () => {
    modal.reject(new Error("User cancelled"));
    modal.hide();
  }

  const handleFileUpload = async (file, updateProgress, abortController) => {
    const fileInfo = await uploadImageToFolderWithProgress(
      file,
      MEDIA_FOLDER,
      (progress) => updateProgress(progress),
      abortController
    )
    return fileInfo;
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Hoàn thành kiểm tra xe</DialogTitle>
            <DialogDescription>
              Ghi lại kết quả kiểm tra ban đầu của xe
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="max-h-[70vh] overflow-y-auto p-2">
            <Field>
              <FieldLabel htmlFor="inspection-comment">Nhận xét</FieldLabel>
              <Textarea
                id="inspection-comment"
                placeholder="Nhập nhận xét về tình trạng xe..."
                className="min-h-[100px]"
                {...register("comment")}
              />
              <FieldDescription>
                Ghi lại tình trạng tổng thể của xe sau khi kiểm tra
              </FieldDescription>
              {errors.comment && (
                <FieldError>{errors.comment.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Hình ảnh kiểm tra</FieldLabel>
              <FileUpload
                acceptedMimeTypes={["image/*"]}
                maxSizePerFileKB={5120}
                maxFilesCount={10}
                onFilesChange={(files) => setValue("media", files)}
                onFileAdded={handleFileUpload}
              />
              <FieldDescription>
                Tải lên hình ảnh minh họa tình trạng xe (tối đa 10 ảnh, mỗi ảnh
                5MB)
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="submit">Lưu kết quả</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

const ServiceTaskAddModal = NiceModal.create(() => {
  const modal = useModal();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(timelineEntrySchema),
    defaultValues: {
      title: "",
      comment: "",
      media: [],
    },
  });

  const onSubmit = async (data) => {
    modal.resolve(data);
    modal.hide();
  };

  const handleCancel = () => {
    modal.reject(new Error("User cancelled"));
    modal.hide();
  }

  const handleFileUpload = async (file, updateProgress, abortController) => {
    const fileInfo = await uploadImageToFolderWithProgress(
      file,
      MEDIA_FOLDER,
      (progress) => updateProgress(progress),
      abortController
    )
    return fileInfo;
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Thêm mục tiến trình sửa chữa</DialogTitle>
            <DialogDescription>
              Ghi lại các công việc đã thực hiện trong quá trình sửa chữa xe
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="max-h-[70vh] overflow-y-auto p-2">
            <Field>
              <FieldLabel htmlFor="service-title">Tiêu đề công việc</FieldLabel>
              <Textarea
                id="service-title"
                placeholder="Ví dụ: Thay lọc gió, Bảo dưỡng hệ thống treo..."
                className="min-h-[60px]"
                {...register("title")}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="service-comment">Mô tả chi tiết</FieldLabel>
              <Textarea
                id="service-comment"
                placeholder="Nhập mô tả chi tiết về công việc đã thực hiện..."
                className="min-h-[100px]"
                {...register("comment")}
              />
              <FieldDescription>
                Chi tiết các bước thực hiện và kết quả công việc
              </FieldDescription>
              {errors.comment && (
                <FieldError>{errors.comment.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Hình ảnh công việc</FieldLabel>
              <FileUpload
                acceptedMimeTypes={["image/*"]}
                maxSizePerFileKB={5120}
                maxFilesCount={10}
                onFilesChange={(files) => setValue("media", files)}
                onFileAdded={handleFileUpload}
              />
              <FieldDescription>
                Tải lên hình ảnh minh họa quá trình thực hiện
              </FieldDescription>
            </Field>

            <div className="ml-auto flex gap-2"></div>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="submit">Thêm mục tiến trình</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

const ServiceTaskTimeline = ({ timeline }) => {
  return (
    <div className="relative">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {timeline.map((entry) => (
          <div key={entry.id} className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />

            <div className="bg-muted/50 rounded-lg px-2 pt-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-medium text-sm">{entry.title}</h5>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{entry.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServiceTaskInspectionCard = ({ task }) => {
  const revalidator = useRevalidator();

  function getButton() {
    if (task.status === "scheduled") {
      return <Button>Bắt đầu kiểm tra</Button>;
    } else if (task.status === "in_progress") {
      return <Button onClick={handleCompleteInspection}>Hoàn thành kiểm tra</Button>;
    } else if (task.status === "completed") {
      return <Button>Chỉnh sửa kiểm tra</Button>;
    }
  }

  async function handleCompleteInspection() {
    try {
      const result = await NiceModal.show(InspectionTaskModal);
      const completeInspectionPromise = completeInspection(task._id, {
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
      </CardContent>
    </Card>
  );
}

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
      const startPromise = startService(task._id);
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

const ServiceOrderDetailContent = ({ tasks }) => {
  const [activeTab, setActiveTab] = useState("inspection");
  const { id } = useParams();
  const revalidator = useRevalidator();

  const inspectionTasks = tasks.filter((task) => task.__t === "inspection");
  const serviceTasks = tasks.filter((task) => task.__t === "servicing");

  const handleScheduleService = async () => {
    try {
      const technician = await NiceModal.show(ChooseStaffModal, {
        mode: "single"
      });

      const task = scheduleService(id, [{
        technicianClerkId: technician.technicianClerkId,
        role: "lead"
      }], 60);

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
            <Button onClick={() => NiceModal.show(ServiceTaskAddModal)}>
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
