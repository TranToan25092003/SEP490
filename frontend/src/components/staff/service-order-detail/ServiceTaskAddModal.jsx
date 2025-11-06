import NiceModal from "@ebay/nice-modal-react";
import { useModal } from "@ebay/nice-modal-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter
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

const timelineEntrySchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  comment: z.string().min(1, "Vui lòng nhập mô tả"),
  media: z.array(z.any()).default([]),
});

const MEDIA_FOLDER = "service_tasks_content";

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

export default ServiceTaskAddModal;
