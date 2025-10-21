import { useNavigate, useLoaderData, useActionData } from "react-router-dom";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { uploadPartImage, validateFile } from "@/utils/uploadCloudinary";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";

export default function AddItem() {
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const [previews, setPreviews] = useState([]); // { file, url, uploaded }
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    sellingPrice: "",
    costPrice: "",
    description: "",
    brand: "",
    quantity: "",
    compatible_model_ids: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);

  // Handle action data response
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        toast.success("Thành công", {
          description: actionData.message || "Sản phẩm đã được tạo thành công",
        });
        navigate("/manager/items");
      } else {
        toast.error("Lỗi", {
          description: actionData.message || "Có lỗi xảy ra khi tạo sản phẩm",
        });
        if (actionData.errors) {
          setErrors(actionData.errors);
        }
      }
    }
  }, [actionData, navigate]);

  const onFiles = useCallback((files) => {
    const validFiles = [];
    const newErrors = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      });

      if (validation.isValid) {
        validFiles.push({
          file,
          url: URL.createObjectURL(file),
          uploaded: false,
        });
      } else {
        newErrors.push(`File ${file.name}: ${validation.errors.join(", ")}`);
      }
    });

    if (newErrors.length > 0) {
      toast.error("Lỗi file", {
        description: newErrors.join("; "),
      });
    }

    if (validFiles.length > 0) {
      setPreviews((prev) => [...prev, ...validFiles]);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  const onPick = useCallback(
    (e) => {
      if (e.target?.files?.length) onFiles(e.target.files);
    },
    [onFiles]
  );

  const removePreview = useCallback((idx) => {
    setPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      try {
        if (removed?.url) URL.revokeObjectURL(removed.url);
      } catch (error) {
        console.warn("Failed to revoke object URL:", error);
      }
      return next;
    });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form
      const newErrors = {};
      if (!formData.name.trim()) newErrors.name = "Tên sản phẩm là bắt buộc";
      if (!formData.sellingPrice || formData.sellingPrice <= 0) {
        newErrors.sellingPrice = "Giá bán phải lớn hơn 0";
      }
      if (!formData.costPrice || formData.costPrice <= 0) {
        newErrors.costPrice = "Giá nhập phải lớn hơn 0";
      }
      if (!formData.quantity || formData.quantity < 0) {
        newErrors.quantity = "Số lượng phải lớn hơn hoặc bằng 0";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // Upload images first
      const uploadedMedia = [];
      for (const preview of previews) {
        if (!preview.uploaded && preview.file) {
          try {
            const uploadResult = await uploadPartImage(preview.file);
            uploadedMedia.push({
              publicId: uploadResult.publicId,
              url: uploadResult.url,
              kind: uploadResult.kind,
            });
          } catch (error) {
            console.error("Upload error:", error);
            toast.error("Lỗi upload ảnh", {
              description: `Không thể upload ${preview.file.name}`,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Prepare data for API
      const submitData = {
        ...formData,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        quantity: parseInt(formData.quantity) || 0,
        media: uploadedMedia,
      };

      // Submit to API
      const response = await customFetch("/manager/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: submitData,
      });

      if (response.data.success) {
        toast.success("Thành công", {
          description: "Sản phẩm đã được tạo thành công",
        });
        navigate("/manager/items");
      } else {
        throw new Error(
          response.data.message || "Có lỗi xảy ra khi tạo sản phẩm"
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Lỗi", {
        description: error.message || "Có lỗi xảy ra khi tạo sản phẩm",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thêm phụ tùng</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-[#df1d01] hover:bg-[#d01b01]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu sản phẩm"}
          </Button>
        </div>
      </div>

      <form id="add-item-form">
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[8px] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <h2 className="text-[16px] font-semibold mb-4">Thông tin cơ bản</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">
                  Tên sản phẩm *
                </label>
                <Input
                  placeholder="Nhập tên sản phẩm"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">
                  Mã sản phẩm
                </label>
                <Input placeholder="VD: SP0001 (tự động tạo)" disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[14px] text-[#2e2e3a]">
                    Thương hiệu
                  </label>
                  <Input
                    placeholder="VD: Honda, Yamaha, Suzuki"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[14px] text-[#2e2e3a]">
                    Số lượng tồn kho *
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 100"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange("quantity", e.target.value)
                    }
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm">{errors.quantity}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-[14px] text-[#2e2e3a]">
                    Giá bán *
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 120000"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      handleInputChange("sellingPrice", e.target.value)
                    }
                    className={errors.sellingPrice ? "border-red-500" : ""}
                  />
                  {errors.sellingPrice && (
                    <p className="text-red-500 text-sm">
                      {errors.sellingPrice}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-[14px] text-[#2e2e3a]">
                    Giá nhập *
                  </label>
                  <Input
                    type="number"
                    placeholder="VD: 100000"
                    value={formData.costPrice}
                    onChange={(e) =>
                      handleInputChange("costPrice", e.target.value)
                    }
                    className={errors.costPrice ? "border-red-500" : ""}
                  />
                  {errors.costPrice && (
                    <p className="text-red-500 text-sm">{errors.costPrice}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">Mô tả</label>
                <Textarea
                  placeholder="Mô tả sản phẩm"
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">
                  Dòng xe tương thích
                </label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      Chọn dòng xe tương thích
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Tìm kiếm dòng xe..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy dòng xe.</CommandEmpty>
                        <CommandGroup>
                          {loaderData?.vehicleModels?.map((model) => (
                            <CommandItem
                              key={model._id}
                              value={`${model.brand} ${model.name}`}
                              onSelect={() => {
                                if (
                                  !formData.compatible_model_ids.includes(
                                    model._id
                                  )
                                ) {
                                  handleInputChange("compatible_model_ids", [
                                    ...formData.compatible_model_ids,
                                    model._id,
                                  ]);
                                }
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.compatible_model_ids.includes(
                                    model._id
                                  )
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {model.brand} {model.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.compatible_model_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.compatible_model_ids.map((modelId) => {
                      const model = loaderData?.vehicleModels?.find(
                        (m) => m._id === modelId
                      );
                      return (
                        <div
                          key={modelId}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {model?.brand} {model?.name}
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange(
                                "compatible_model_ids",
                                formData.compatible_model_ids.filter(
                                  (id) => id !== modelId
                                )
                              );
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[8px] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <h2 className="text-[16px] font-semibold mb-4">Hình ảnh</h2>
            <div
              className="h-[220px] rounded-[8px] border border-dashed grid place-items-center text-[#656575]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <div className="text-center">
                Kéo & thả ảnh vào đây hoặc
                <label className="ml-1 underline cursor-pointer">
                  chọn file
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPick}
                  />
                </label>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={p.url}
                      alt="preview"
                      className="w-full h-28 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removePreview(idx)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-red-600 text-white w-6 h-6 grid place-items-center shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
