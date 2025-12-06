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
import { Spinner } from "@/components/ui/spinner";
import { getServiceTaskById } from "@/api/serviceTasks";

const inspectionFormSchema = z.object({
  comment: z.string().trim().min(1, "Vui lòng nhập nhận xét").max(5000, "Nhận xét quá dài"),
  media: z.array(z.any()).min(1, "Vui lòng tải lên ít nhất một hình ảnh")
});

const MEDIA_FOLDER = "service_tasks_content";

const InspectionTaskModal = NiceModal.create(({ taskId }) => {
  const modal = useModal();
  const [loading, setLoading] = useState(!!taskId);
  const [isUploading, setIsUploading] = useState(false);

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

  const [initialMedia, setInitialMedia] = useState([]);

  useEffect(() => {
    if (taskId) {
      const fetchTaskDetails = async () => {
        try {
          const taskDetails = await getServiceTaskById(taskId);
          setValue("comment", taskDetails.comment || "");
          setInitialMedia(taskDetails.media || []);
        } catch (error) {
          console.error("Failed to fetch task details:", error);
        }
        setLoading(false);
      };

      fetchTaskDetails();
    }
  }, [taskId]);

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
        <DialogTitle>Hoàn thành kiểm tra xe</DialogTitle>
        <DialogDescription>
          Ghi lại kết quả kiểm tra ban đầu của xe
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="max-h-[70vh] overflow-y-auto p-2">
        <Field>
          <FieldLabel htmlFor="inspection-comment" className="required-asterisk">
            Nhận xét
          </FieldLabel>
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
          <FieldLabel className="required-asterisk">Hình ảnh kiểm tra</FieldLabel>
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
            Tải lên hình ảnh minh họa tình trạng xe (tối đa 10 ảnh, mỗi ảnh 5MB)
          </FieldDescription>
          {errors.media && <FieldError>{errors.media.message}</FieldError>}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Đang tải lên..." : "Lưu kết quả"}
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

export default InspectionTaskModal;
