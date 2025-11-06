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

const inspectionFormSchema = z.object({
  comment: z.string().min(1, "Vui lòng nhập nhận xét"),
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

export default InspectionTaskModal;
