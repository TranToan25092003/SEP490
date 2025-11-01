import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense, useState } from "react";
import { useLoaderData, useParams, Await, Link } from "react-router-dom";
import { getServiceOrderById } from "@/api/serviceOrders";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
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
import { CheckCircle2, Circle, Plus } from "lucide-react";

function loader({ params }) {
  return {
    serviceOrder: getServiceOrderById(params.id),
  };
}

// Form schemas
const inspectionFormSchema = z.object({
  comment: z.string().min(1, "Vui lòng nhập nhận xét"),
  files: z.array(z.any()).default([]),
});

const timelineEntrySchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  comment: z.string().min(1, "Vui lòng nhập mô tả"),
  files: z.array(z.any()).default([]),
});

const InspectionTaskForm = ({ taskId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      comment: "",
      files: [],
    },
  });

  const onSubmit = async (data) => {
    console.log("Inspection Task Submit:", { taskId, ...data });
    toast.success("Đã lưu kết quả kiểm tra");
  };

  const handleFileUpload = async (file, updateProgress, abortController) => {
    // Simulate upload
    for (let i = 0; i <= 100; i += 10) {
      if (abortController.signal.aborted) {
        throw new Error("Upload cancelled");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      updateProgress(i);
    }
    return { url: URL.createObjectURL(file), name: file.name };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
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
          {errors.comment && <FieldError>{errors.comment.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Hình ảnh kiểm tra</FieldLabel>
          <FileUpload
            acceptedMimeTypes={["image/*"]}
            maxSizePerFileKB={5120}
            maxFilesCount={10}
            onFilesChange={(files) => setValue("files", files)}
            onFileAdded={handleFileUpload}
          />
          <FieldDescription>
            Tải lên hình ảnh minh họa tình trạng xe (tối đa 10 ảnh, mỗi ảnh 5MB)
          </FieldDescription>
        </Field>

        <div className="ml-auto flex gap-2">
          <Button type="submit">Lưu kết quả</Button>
          <Button variant="outline" type="button">
            Hủy
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};

const ServiceTaskTimeline = ({ taskId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(timelineEntrySchema),
    defaultValues: {
      title: "",
      comment: "",
      files: [],
    },
  });

  const mockTimeline = [
    {
      id: "1",
      title: "Thay dầu động cơ",
      comment: "Đã thay dầu Shell Helix HX7 10W-40",
      timestamp: "2024-10-31 09:30",
      photoUrls: [],
    },
    {
      id: "2",
      title: "Kiểm tra phanh",
      comment: "Má phanh còn 60%, hoạt động tốt",
      timestamp: "2024-10-31 10:15",
      photoUrls: [],
    },
    {
      id: "3",
      title: "Vệ sinh buồng đốt",
      comment: "Đã vệ sinh buồng đốt và kim phun",
      timestamp: "2024-10-31 11:00",
      photoUrls: [],
    },
  ];

  const onSubmit = async (data) => {
    console.log("Service Task Timeline Submit:", { taskId, ...data });
    toast.success("Đã thêm mục vào tiến trình");
    reset();
  };

  const handleFileUpload = async (file, updateProgress, abortController) => {
    for (let i = 0; i <= 100; i += 10) {
      if (abortController.signal.aborted) {
        throw new Error("Upload cancelled");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      updateProgress(i);
    }
    return { url: URL.createObjectURL(file), name: file.name };
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Lịch sử công việc</h4>
        <div className="relative">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {mockTimeline.map((entry) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                <div className="bg-muted/50 rounded-lg px-2 pt-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm">{entry.title}</h5>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4" />
          <h4 className="font-medium text-sm">Thêm công việc mới</h4>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
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
              {errors.comment && <FieldError>{errors.comment.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Hình ảnh công việc</FieldLabel>
              <FileUpload
                acceptedMimeTypes={["image/*"]}
                maxSizePerFileKB={5120}
                maxFilesCount={10}
                onFilesChange={(files) => setValue("files", files)}
                onFileAdded={handleFileUpload}
              />
              <FieldDescription>
                Tải lên hình ảnh minh họa quá trình thực hiện
              </FieldDescription>
            </Field>

            <div className="ml-auto flex gap-2">
              <Button type="submit">
                <Plus className="w-4 h-4" />
                Thêm vào tiến trình
              </Button>
              <Button variant="outline" type="button" onClick={() => reset()}>
                Đặt lại
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
};

const ServiceOrderDetailContent = ({ serviceOrder }) => {
  const [activeTab, setActiveTab] = useState("inspection");

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
            <span>Tiến trình sửa chữa</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inspection" className="mt-0">
        <div className="bg-card border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Kiểm tra xe</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ghi lại kết quả kiểm tra ban đầu của xe
            </p>
          </div>
          <InspectionTaskForm
            taskId={serviceOrder?.inspectionTaskId || "mock-inspection-id"}
          />
        </div>
      </TabsContent>

      <TabsContent value="service" className="mt-0">
        <div className="bg-card border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Tiến trình sửa chữa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và cập nhật tiến độ sửa chữa
            </p>
          </div>
          <ServiceTaskTimeline
            taskId={serviceOrder?.serviceTaskId || "mock-service-id"}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};

const ServiceOrderDetail = () => {
  const { serviceOrder } = useLoaderData();
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
          resolve={serviceOrder}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải tiến trình
            </div>
          }
        >
          {(data) => (
            <ServiceOrderDetailContent serviceOrder={data} />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderDetail.loader = loader;

export default ServiceOrderDetail;
