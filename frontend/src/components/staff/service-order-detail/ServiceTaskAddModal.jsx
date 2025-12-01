import NiceModal from "@ebay/nice-modal-react";
import { useModal } from "@ebay/nice-modal-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { uploadImageToFolderWithProgress } from "@/utils/uploadCloudinary";
import { useEffect, useState } from "react";
import { getServiceTaskTimelineEntry } from "@/api/serviceTasks";
import { Spinner } from "@/components/ui/spinner";

const timelineEntrySchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  comment: z.string().min(1, "Vui lòng nhập mô tả"),
  media: z.array(z.any()).default([]),
});

const MEDIA_FOLDER = "service_tasks_content";

const ServiceTaskAddModal = NiceModal.create(({ taskId, entryId }) => {
  const modal = useModal();
  const [loading, setLoading] = useState(!!entryId && !!taskId);
  const [initialMedia, setInitialMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

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

  useEffect(() => {
    if (entryId && taskId) {
      const loadEntry = async () => {
        setLoading(true);
        try {
          const entry = await getServiceTaskTimelineEntry(taskId, entryId);
          setValue("title", entry.title);
          setValue("comment", entry.comment);
          setInitialMedia(entry.media || []);
        } catch (error) {
          console.error("Failed to load entry:", error);
        } finally {
          setLoading(false);
        }
      };
      loadEntry();
    }
  }, [entryId, taskId]);

  const onSubmit = async (data) => {
    modal.resolve(data);
    modal.remove();
  };

  const handleCancel = () => {
    modal.reject(new Error("User cancelled"));
    modal.remove();
  };

  const handleFileUpload = async (file, updateProgress, abortController) => {
    const fileInfo = await uploadImageToFolderWithProgress(
      file,
      MEDIA_FOLDER,
      (progress) => updateProgress(progress),
      abortController
    );
    return fileInfo;
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>Thêm mục tiến trình sửa chữa</DialogTitle>
        <DialogDescription>
          Ghi lại các công việc đã thực hiện trong quá trình sửa chữa xe
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="max-h-[70vh] overflow-y-auto p-2 my-3">
        <Field>
          <FieldLabel htmlFor="service-title" className="required-asterisk">
            Tiêu đề công việc
          </FieldLabel>
          <Textarea
            id="service-title"
            placeholder="Ví dụ: Thay lọc gió, Bảo dưỡng hệ thống treo..."
            className="min-h-[60px]"
            {...register("title")}
          />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="service-comment" className="required-asterisk">
            Mô tả chi tiết
          </FieldLabel>
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
            onFilesChange={(files) => setValue("media", files)}
            onFileAdded={handleFileUpload}
            onUploadStatusChange={setIsUploading}
            renderInitial={(file) => (
              <img
                src={file.url}
                alt="Initial Uploaded"
                className="size-40 rounded-md object-cover"
              />
            )}
            init={initialMedia}
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
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Đang tải lên..." : "Lưu thay đổi"}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-4xl">
        {!loading ? (
          renderForm()
        ) : (
          <div className="flex flex-col items-center max-h-[70vh] overflow-y-auto p-2 justify-center py-8 space-y-2">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default ServiceTaskAddModal;
