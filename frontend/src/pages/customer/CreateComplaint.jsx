import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UploadCloud, Send, X, Loader2, Star } from 'lucide-react';
import complaintBannerImage from '@/assets/complaint-banner.png';
import { uploadImageToFolder as uploadComplaintImage, validateFile } from "@/utils/uploadCloudinary";
import { customFetch } from '@/utils/customAxios';
import { toast } from "sonner";

// Danh sách danh mục dựa trên schema
const complaintCategories = [
  "Chất lượng dịch vụ",
  "Chất lượng phụ tùng",
  "Thái độ nhân viên",
  "Thời gian chờ đợi",
  "Giá cả & Thanh toán",
  "Cơ sở vật chất",
  "Khác"
];

function CreateComplaintPage() {
    const { userId } = useAuth();
    const hardcodedSoId = "68fb321427149d97dac22b15";
    const [formData, setFormData] = useState({
        fullName: '',
        issue: '', // Tên/Tiêu đề khiếu nại
        phone: '',
        content: '',
        so_id: hardcodedSoId,
        rating: 0,
        category: '', // Thêm category vào state
    });
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const [hoverRating, setHoverRating] = useState(0);

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

     const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (newRating) => {
         setFormData(prev => ({ ...prev, rating: newRating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            toast.error("Lỗi", { description: "Vui lòng đăng nhập để gửi khiếu nại." });
            return;
        }

        if (!formData.issue || !formData.content || !formData.so_id || !formData.category) {
            toast.error("Thiếu thông tin", { description: "Vui lòng nhập đầy đủ các trường bắt buộc (*)." });
            return;
        }

        setIsSubmitting(true);
        try {
            const uploadedImageUrls = [];
            for (const preview of previews) {
                if (!preview.uploaded && preview.file) {
                    try {
                        const uploadResult = await uploadComplaintImage(preview.file, "complaints");
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
                category: formData.category,
                rating: formData.rating > 0 ? formData.rating : undefined,
            };

            const response = await customFetch.post('/complaints', payload);

            if (response.data.success) {
                toast.success("Thành Công", { description: "Khiếu nại của bạn đã được gửi." });
                setFormData({ fullName: '', issue: '', phone: '', content: '', so_id: hardcodedSoId, rating: 0, category: '' });
                previews.forEach(p => URL.revokeObjectURL(p.url));
                setPreviews([]);
                setHoverRating(0);
            } else {
                 throw new Error(response.data.message || "Gửi khiếu nại thất bại từ server.");
            }

        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Gửi thất bại", { description: error.message || "Đã có lỗi xảy ra khi gửi khiếu nại." });
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
          <h1 className="text-8xl font-extrabold md:text-9xl lg:text-[10rem] xl:text-[12rem] md:-translate-x-8 lg:-translate-x-12" style={{ textShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }} >
            <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }} > Motor </span>
            <span className="text-white">Mate</span>
          </h1>
          <div className="w-4/5 max-w-xs md:max-w-md lg:max-w-lg">
            <img src={complaintBannerImage} alt="Motorcycle and parts" className="w-full h-auto" />
          </div>
          <p className="text-xl font-semibold text-white md:text-2xl">
            Tạo đơn khiếu nại bên dưới
          </p>
        </div>
      </section>

      {/* --- COMPLAINT FORM SECTION --- */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1271px] px-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Order ID - Row 1 */}
             <div>
                 <label className="text-base font-medium text-stone-700">ID Đơn Hàng Dịch Vụ <span className="text-red-500">*</span></label>
                 <Input 
                    name="so_id" 
                    value={formData.so_id} 
                    readOnly 
                    disabled 
                    className="mt-3 h-12 rounded-xl bg-neutral-200 text-gray-500 cursor-not-allowed" 
                 />
                 <p className="text-xs text-gray-500 mt-1">ID đơn hàng liên quan đến khiếu nại.</p>
             </div>
             
             {/* Name, Phone - Row 2 */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
               <div>
                <label className="text-base font-medium text-stone-700">Họ Và Tên Người Khiếu Nại</label>
                <Input name="fullName" placeholder="Nhập họ và tên của bạn" value={formData.fullName} onChange={handleInputChange} className="mt-3 h-12 rounded-xl bg-neutral-100" />
              </div>
              <div>
                <label className="text-base font-medium text-stone-700">Số Điện Thoại</label>
                <Input name="phone" placeholder="Nhập số điện thoại liên hệ" value={formData.phone} onChange={handleInputChange} className="mt-3 h-12 rounded-xl bg-neutral-100" />
              </div>
            </div>

            {/* Category, Issue Title, Rating - Row 3 */}
            <div className="grid grid-cols-1 gap-8 md:flex md:items-end md:justify-between">
                <div className="md:flex-1">
                    <label className="text-base font-medium text-stone-700">Vấn Đề Khiếu Nại (Tiêu đề) <span className="text-red-500">*</span></label>
                    <Input name="issue" placeholder="Ví dụ: Dịch vụ, Sản phẩm lỗi" value={formData.issue} onChange={handleInputChange} required className="mt-3 h-12 rounded-xl bg-neutral-100" />
                </div>
                <div className="md:flex-1 md:ml-24">
                    <label className="text-base font-medium text-stone-700">Danh Mục Khiếu Nại <span className="text-red-500">*</span></label>
                    <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleSelectChange('category', value)}
                        required
                    >
                        <SelectTrigger className="mt-3 h-12 rounded-xl bg-neutral-100">
                            <SelectValue placeholder="Chọn danh mục khiếu nại" />
                        </SelectTrigger>
                        <SelectContent>
                            {complaintCategories.map((cat, index) => (
                                <SelectItem key={index} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="md:flex-shrink-0">
                    <label className="text-base font-medium text-stone-700">Đánh giá (Tùy chọn)</label>
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
                                        ? 'text-yellow-400 fill-yellow-400' 
                                        : 'text-zinc-300'
                                    }`}
                                    onClick={() => handleRatingChange(starValue)}
                                    onMouseEnter={() => setHoverRating(starValue)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2 flex flex-col">
                <label className="text-base font-medium text-stone-700">Giải Thích Chi Tiết <span className="text-red-500">*</span></label>
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
                 <label className="text-base font-medium text-stone-700">Hình Ảnh Thực Tế (Nếu Có)</label>
                 <div 
                    className="mt-3 flex-grow flex flex-col rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition-colors p-4 min-h-[350px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                 >
                    {previews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <UploadCloud className="mx-auto h-24 w-24 text-stone-700/25" />
                            <p className="mt-2 text-xs capitalize text-stone-700/75">Kéo thả ảnh vào đây, hoặc <span className="underline">chọn file</span></p>
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
                                    <div key={index} className="relative aspect-square group">
                                        <img src={preview.url} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); removePreview(index); }}
                                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition rounded-full bg-red-600 text-white w-6 h-6 grid place-items-center shadow leading-none"
                                            aria-label={`Remove image ${index + 1}`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                             {previews.length < 5 && ( 
                               <Button variant="outline" type="button" className="mt-4 h-8 text-sm capitalize w-full" onClick={() => fileInputRef.current.click()}>
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
                <Button type="submit" className="gap-2 rounded-xl bg-rose-600/75 hover:bg-rose-600" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    <span>{isSubmitting ? 'Đang gửi...' : 'Gửi'}</span>
                </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default CreateComplaintPage;