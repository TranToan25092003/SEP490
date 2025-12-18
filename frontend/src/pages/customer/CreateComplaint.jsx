import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadCloud,
  Send,
  X,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import complaintBannerImage from "@/assets/complaint-banner.png";
import {
  uploadImageToFolder as uploadComplaintImage,
  validateFile,
} from "@/utils/uploadCloudinary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { customFetch } from "@/utils/customAxios";
import { getUserBookings } from "@/api/bookings";
import { getPublicComplaintCategories } from "@/api/complaintCategories";
import { getMyComplaints } from "@/api/complaints";
import { toast } from "sonner";

function CreateComplaintPage() {
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: "",
    issue: "", // Tên/Tiêu đề khiếu nại
    phone: "",
    content: "",
    so_id: "",
    rating: 0,
    categoryId: "", // Thêm category vào state
  });
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [isLoadingServiceOrders, setIsLoadingServiceOrders] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false);
  const [complaintReplies, setComplaintReplies] = useState([]);
  const [highlightedComplaintId, setHighlightedComplaintId] = useState(null);
  const [currentComplaintIndex, setCurrentComplaintIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getPublicComplaintCategories();
        if (mounted) {
          setCategoryOptions(data);
        }
      } catch (error) {
        console.error("Failed to load complaint categories", error);
        toast.error("Không thể tải danh mục khiếu nại");
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    };

    fetchCategories();

    if (!userId) {
      setServiceOrders([]);
      setFormData((prev) => ({ ...prev, so_id: "" }));
      return () => {
        mounted = false;
      };
    }

    const fetchServiceOrders = async () => {
      setIsLoadingServiceOrders(true);
      try {
        const bookings = await getUserBookings();
        const options =
          bookings
            ?.filter(
              (booking) =>
                booking.serviceOrderId && booking.status === "completed"
            )
            .map((booking) => ({
              id: booking.serviceOrderId,
              label: formatServiceOrderLabel(booking),
            })) || [];
        if (mounted) {
          setServiceOrders(options);
        }
      } catch (error) {
        console.error("Failed to fetch service orders", error);
        toast.error("Không thể tải danh sách đơn dịch vụ");
      } finally {
        if (mounted) setIsLoadingServiceOrders(false);
      }
    };

    fetchServiceOrders();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const formatServiceOrderLabel = (booking) => {
    const code = booking.serviceOrderId
      ? `#${booking.serviceOrderId?.toString().slice(-6)}`
      : "N/A";
    const vehicleLabel =
      booking.vehicle?.licensePlate ||
      booking.vehicle?.model ||
      booking.vehicle?.brand ||
      "Xe";
    const createdDate = booking.slotStartTime
      ? new Date(booking.slotStartTime).toLocaleDateString("vi-VN")
      : "";
    return `${code} • ${vehicleLabel} • ${createdDate}`;
  };

  const formatServiceOrderCode = (soId) => {
    if (!soId) return "N/A";
    return `#${soId.toString().slice(-6)}`;
  };

  const translateComplaintStatus = (status) => {
    switch (status) {
      case "resolved":
        return "Đã phản hồi";
      case "rejected":
        return "Đã từ chối";
      case "pending":
      default:
        return "Đang chờ xử lý";
    }
  };

  const getComplaintBadgeVariant = (status) => {
    switch (status) {
      case "resolved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderRatingSummary = (rating) => {
    if (!rating) return "Chưa đánh giá";
    return `${rating}/5`;
  };

  const fetchComplaintReplies = useCallback(
    async (targetId = null) => {
      setIsLoadingReplies(true);
      try {
        const data = await getMyComplaints();
        setComplaintReplies(data || []);
        setHasLoadedReplies(true);
        if (data && data.length > 0) {
          const searchId = targetId || highlightedComplaintId;
          if (searchId) {
            const idx = data.findIndex((c) => c.id === searchId);
            setCurrentComplaintIndex(idx >= 0 ? idx : 0);
          } else {
            setCurrentComplaintIndex(0);
          }
        } else {
          setCurrentComplaintIndex(0);
        }
      } catch (error) {
        console.error("Failed to load complaint replies", error);
        toast.error("Không thể tải danh sách phản hồi");
      } finally {
        setIsLoadingReplies(false);
      }
    },
    [highlightedComplaintId]
  );
  const openReplyModal = useCallback(
    async (targetId = null) => {
      setHighlightedComplaintId(targetId);
      setReplyModalOpen(true);
      if (!hasLoadedReplies) {
        await fetchComplaintReplies(targetId);
      } else if (targetId) {
        const idx = complaintReplies.findIndex((c) => c.id === targetId);
        if (idx >= 0) {
          setCurrentComplaintIndex(idx);
        }
      }
    },
    [fetchComplaintReplies, hasLoadedReplies, complaintReplies]
  );

  const handleReplyModalChange = useCallback((open) => {
    setReplyModalOpen(open);
    if (!open) {
      setHighlightedComplaintId(null);
    }
  }, []);

  const handleRefreshReplies = async () => {
    await fetchComplaintReplies(highlightedComplaintId);
  };

  const currentComplaint =
    complaintReplies.length > 0
      ? complaintReplies[currentComplaintIndex]
      : null;
  const totalComplaints = complaintReplies.length;

  useEffect(() => {
    const replyId = searchParams.get("replyComplaintId");
    if (replyId && userId) {
      (async () => {
        await openReplyModal(replyId);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("replyComplaintId");
        setSearchParams(newParams, { replace: true });
      })();
    }
  }, [searchParams, userId, openReplyModal, setSearchParams]);

  useEffect(() => {
    if (complaintReplies.length === 0) {
      setCurrentComplaintIndex(0);
      return;
    }
    setCurrentComplaintIndex((prev) =>
      Math.min(prev, complaintReplies.length - 1)
    );
  }, [complaintReplies]);

  const handleReplyButtonClick = () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để xem phản hồi.");
      return;
    }
    openReplyModal();
  };

  const onFiles = useCallback((files) => {
    const validFiles = [];
    const newErrors = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
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
      setPreviews((prev) => [...prev, ...validFiles].slice(0, 5));
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (newRating) => {
    setFormData((prev) => ({ ...prev, rating: newRating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Lỗi", {
        description: "Vui lòng đăng nhập để gửi khiếu nại.",
      });
      return;
    }

    if (
      !formData.issue ||
      !formData.content ||
      !formData.so_id ||
      !formData.categoryId
    ) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng nhập đầy đủ các trường bắt buộc (*).",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedImageUrls = [];
      for (const preview of previews) {
        if (!preview.uploaded && preview.file) {
          try {
            const uploadResult = await uploadComplaintImage(
              preview.file,
              "complaints"
            );
            uploadedImageUrls.push(uploadResult.url);
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

      const payload = {
        title: formData.issue,
        content: formData.content,
        so_id: formData.so_id,
        photos: uploadedImageUrls,
        clerkId: userId,
        categoryId: formData.categoryId,
        categoryName: categoryOptions.find(
          (cat) => cat._id === formData.categoryId
        )?.name,
        rating: formData.rating > 0 ? formData.rating : undefined,
      };

      const response = await customFetch.post("/complaints", payload);

      if (response.data.success) {
        toast.success("Thành Công", {
          description: "Khiếu nại của bạn đã được gửi.",
        });
        setFormData({
          fullName: "",
          issue: "",
          phone: "",
          content: "",
          so_id: "",
          rating: 0,
          categoryId: "",
        });
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
        setHoverRating(0);
      } else {
        throw new Error(
          response.data.message || "Gửi khiếu nại thất bại từ server."
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Gửi thất bại", {
        description: error.message || "Đã có lỗi xảy ra khi gửi khiếu nại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full">
      {/* --- HERO BANNER SECTION --- */}
      <section className="relative w-full overflow-hidden py-8 md:py-12">
        <div className="absolute inset-0 flex flex-col md:flex-row">
          <div className="w-full h-1/2 md:w-1/2 md:h-full bg-red-600"></div>
          <div className="w-full h-1/2 md:w-1/2 md:h-full bg-zinc-900"></div>
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 p-8 text-center md:gap-12">
          <h1
            className="text-8xl font-extrabold md:text-9xl lg:text-[10rem] xl:text-[12rem] md:-translate-x-8 lg:-translate-x-12"
            style={{ textShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}
          >
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "2px white" }}
            >
              {" "}
              Motor{" "}
            </span>
            <span className="text-white">Mate</span>
          </h1>
          <div className="w-4/5 max-w-xs md:max-w-md lg:max-w-lg">
            <img
              src={complaintBannerImage}
              alt="Motorcycle and parts"
              className="w-full h-auto"
            />
          </div>
          <p className="text-xl font-semibold text-white md:text-2xl">
            Tạo đơn khiếu nại bên dưới
          </p>
        </div>
      </section>

      {/* --- COMPLAINT FORM SECTION --- */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1271px] px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-semibold text-stone-900">
                Gửi khiếu nại mới
              </h2>
              <p className="text-sm text-stone-500">
                Theo dõi phản hồi từ nhân viên ngay tại đây.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleReplyButtonClick}
            >
              Xem phản hồi khiếu nại
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Order ID - Row 1 */}
            <div>
              <label className="text-base font-medium text-stone-700">
                Đơn Hàng Dịch Vụ <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.so_id}
                onValueChange={(value) => handleSelectChange("so_id", value)}
                required
                disabled={isLoadingServiceOrders || serviceOrders.length === 0}
              >
                <SelectTrigger className="mt-3 h-12 rounded-xl bg-neutral-100 text-left">
                  <SelectValue
                    placeholder={
                      isLoadingServiceOrders
                        ? "Đang tải đơn hàng..."
                        : serviceOrders.length === 0
                        ? "Bạn chưa có đơn dịch vụ nào hoàn tất"
                        : "Chọn đơn dịch vụ"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {serviceOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng chọn đơn dịch vụ từ lịch sử sửa xe của bạn.
              </p>
            </div>

            {/* Name, Phone - Row 2 */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <label className="text-base font-medium text-stone-700">
                  Họ Và Tên Người Khiếu Nại
                </label>
                <Input
                  name="fullName"
                  placeholder="Nhập họ và tên của bạn"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="mt-3 h-12 rounded-xl bg-neutral-100"
                />
              </div>
              <div>
                <label className="text-base font-medium text-stone-700">
                  Số Điện Thoại
                </label>
                <Input
                  name="phone"
                  placeholder="Nhập số điện thoại liên hệ"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-3 h-12 rounded-xl bg-neutral-100"
                />
              </div>
            </div>

            {/* Category, Issue Title, Rating - Row 3 */}
            <div className="grid grid-cols-1 gap-8 md:flex md:items-end md:justify-between">
              <div className="md:flex-1">
                <label className="text-base font-medium text-stone-700">
                  Vấn Đề Khiếu Nại (Tiêu đề){" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  name="issue"
                  placeholder="Ví dụ: Dịch vụ, Sản phẩm lỗi"
                  value={formData.issue}
                  onChange={handleInputChange}
                  required
                  className="mt-3 h-12 rounded-xl bg-neutral-100"
                />
              </div>
              <div className="md:flex-1 md:ml-24">
                <label className="text-base font-medium text-stone-700">
                  Danh Mục Khiếu Nại <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    handleSelectChange("categoryId", value)
                  }
                  required
                  disabled={isLoadingCategories || categoryOptions.length === 0}
                >
                  <SelectTrigger className="mt-3 h-12 rounded-xl bg-neutral-100">
                    <SelectValue
                      placeholder={
                        isLoadingCategories
                          ? "Đang tải danh mục..."
                          : "Chọn danh mục khiếu nại"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="md:flex-shrink-0">
                <label className="text-base font-medium text-stone-700">
                  Đánh giá (Tùy chọn)
                </label>
                <div
                  className="mt-3 flex items-center gap-1 h-12" // Set height to match inputs
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                      <Star
                        key={starValue}
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          (hoverRating || formData.rating) >= starValue
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-zinc-300"
                        }`}
                        onClick={() => handleRatingChange(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                      />
                    );
                  })}
                </div>
              </div> */}
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2 flex flex-col">
                <label className="text-base font-medium text-stone-700">
                  Giải Thích Chi Tiết <span className="text-red-500">*</span>
                </label>
                <div className="mt-3 flex-grow rounded-xl bg-white p-4 shadow-[0px_0px_32px_0px_rgba(0,0,0,0.07)]">
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải..."
                    required
                    className="h-full min-h-[350px] resize-none rounded-xl bg-neutral-100 border-none focus-visible:ring-1 focus-visible:ring-red-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col">
                <label className="text-base font-medium text-stone-700">
                  Hình Ảnh Thực Tế (Nếu Có)
                </label>
                <div
                  className="mt-3 flex-grow flex flex-col rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition-colors p-4 min-h-[350px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                >
                  {previews.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center h-full text-center cursor-pointer"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <UploadCloud className="mx-auto h-24 w-24 text-stone-700/25" />
                      <p className="mt-2 text-xs capitalize text-stone-700/75">
                        Kéo thả ảnh vào đây, hoặc{" "}
                        <span className="underline">chọn file</span>
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={onPick}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full">
                      <div className="grid grid-cols-3 gap-2">
                        {previews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative aspect-square group"
                          >
                            <img
                              src={preview.url}
                              alt={`preview ${index}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePreview(index);
                              }}
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-red-600 text-white w-6 h-6 grid place-items-center shadow leading-none"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      {previews.length < 5 && (
                        <Button
                          variant="outline"
                          type="button"
                          className="mt-4 h-8 text-sm capitalize w-full"
                          onClick={() => fileInputRef.current.click()}
                        >
                          Thêm ảnh khác
                        </Button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={onPick}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="gap-2 rounded-xl bg-rose-600/75 hover:bg-rose-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isSubmitting ? "Đang gửi..." : "Gửi"}</span>
              </Button>
            </div>
          </form>
        </div>
      </section>

      <Dialog open={replyModalOpen} onOpenChange={handleReplyModalChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phản hồi khiếu nại của bạn</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              Kiểm tra những phản hồi gần nhất từ đội ngũ MotorMate.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshReplies}
              disabled={isLoadingReplies}
            >
              {isLoadingReplies ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tải
                </>
              ) : (
                "Tải lại"
              )}
            </Button>
          </div>

          {isLoadingReplies ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
            </div>
          ) : totalComplaints === 0 ? (
            <p className="text-center text-sm text-stone-500 py-8">
              Bạn chưa có phản hồi nào từ nhân viên.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-stone-500">
                <span>
                  Khiếu nại {currentComplaintIndex + 1}/{totalComplaints}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentComplaintIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={currentComplaintIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentComplaintIndex((prev) =>
                        Math.min(prev + 1, totalComplaints - 1)
                      )
                    }
                    disabled={currentComplaintIndex === totalComplaints - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {currentComplaint && (
                <div
                  className={`rounded-2xl border p-5 transition-shadow bg-white ${
                    highlightedComplaintId === currentComplaint.id
                      ? "border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.18)]"
                      : "border-stone-200 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-stone-900">
                        {currentComplaint.title}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatServiceOrderCode(currentComplaint.soId)} •{" "}
                        {formatDateTime(currentComplaint.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={getComplaintBadgeVariant(
                        currentComplaint.status
                      )}
                      className="self-start"
                    >
                      {translateComplaintStatus(currentComplaint.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-stone-400">
                        Danh mục
                      </p>
                      <p className="text-sm font-medium text-stone-700">
                        {currentComplaint.categoryName || "Khác"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-stone-400">
                        Đánh giá
                      </p>
                      <p className="text-sm font-medium text-stone-700">
                        {renderRatingSummary(currentComplaint.rating)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-stone-50 p-4">
                    <h4 className="text-sm font-semibold text-stone-800 mb-2">
                      Nội dung khiếu nại
                    </h4>
                    <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                      {currentComplaint.content}
                    </p>
                  </div>

                  {currentComplaint.photos &&
                    currentComplaint.photos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-stone-800 mb-2">
                          Hình ảnh bạn đã gửi
                        </h4>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {currentComplaint.photos.map((photoUrl, idx) => (
                            <div
                              key={`${currentComplaint.id}-photo-${idx}`}
                              className="aspect-video overflow-hidden rounded-lg border bg-stone-100"
                            >
                              <img
                                src={photoUrl}
                                alt={`Complaint photo ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-4">
                    <h4 className="text-sm font-semibold text-red-700 mb-2">
                      Phản hồi từ MotorMate
                    </h4>
                    {currentComplaint.reply ? (
                      <>
                        <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                          {currentComplaint.reply.content}
                        </p>
                        <p className="text-xs text-stone-500 mt-3">
                          Phản hồi lúc{" "}
                          {formatDateTime(currentComplaint.reply.repliedAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-stone-500 italic">
                        Nhân viên chưa phản hồi khiếu nại này.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default CreateComplaintPage;
