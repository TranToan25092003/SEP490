import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Send, X, Loader2 } from 'lucide-react';
import complaintBannerImage from '@/components/../../src/assets/complaint-banner.png';
import { uploadPartImage, validateFile } from "@/utils/uploadCloudinary"; 
import { toast } from "sonner";

function CreateComplaint() {
    const [formData, setFormData] = useState({
        fullName: '',
        issue: '',
        phone: '',
        content: '',
    });
    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        
        const validFiles = selectedFiles.filter(file => {
            const error = validateFile(file);
            if (error) {
                toast.error("Lỗi Tải Lên", { description: error });
                return false;
            }
            return true;
        });

        setFiles(prevFiles => [
            ...prevFiles,
            ...validFiles.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file)
            }))
        ]);
        // Reset file input to allow selecting the same file again
        event.target.value = null;
    };
    
    const removeFile = (fileToRemove) => {
        setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const uploadedImageUrls = await Promise.all(
                files.map(file => uploadPartImage(file))
            );

            const payload = {
                ...formData,
                photos: uploadedImageUrls,
            };

            console.log("Submitting to backend:", payload);
            // Example: await customFetch.post('/client/complaints', payload);

            toast.success("Thành Công", { description: "Khiếu nại của bạn đã được gửi." });
            setFormData({ fullName: '', issue: '', phone: '', content: '' });
            setFiles([]);

        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Gửi thất bại", { description: error.message || "Đã có lỗi xảy ra." });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <main className="w-full">
      {/* --- HERO BANNER SECTION --- */}
      <section className="relative w-full overflow-hidden py-8 md:py-12">
        {/* Two-color background */}
        <div className="absolute inset-0 flex flex-col md:flex-row">
          <div className="w-full h-1/2 md:w-1/2 md:h-full bg-red-600"></div>
          <div className="w-full h-1/2 md:w-1/2 md:h-full bg-zinc-900"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 p-8 text-center md:gap-12">
          {/* MotorMate Title */}
          <h1
            className="text-8xl font-extrabold md:text-9xl lg:text-[10rem] xl:text-[12rem] md:-translate-x-8 lg:-translate-x-12"
            style={{
              textShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '2px white' }}
            >
              Motor
            </span>
            <span className="text-white">Mate</span>
          </h1>

          {/* Central Image */}
          <div className="w-4/5 max-w-xs md:max-w-md lg:max-w-lg">
            <img 
              src={complaintBannerImage} 
              alt="Motorcycle and parts" 
              className="w-full h-auto"
            />
          </div>

          {/* Bottom Text */}
          <p className="text-xl font-semibold text-white md:text-2xl">
            Tạo đơn khiếu nại bên dưới
          </p>
        </div>
      </section>

      {/* --- COMPLAINT FORM SECTION --- */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1271px] px-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Top input fields */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <label className="text-base font-medium text-stone-700">Họ Và Tên Người Khiếu Nại</label>
                <Input name="fullName" placeholder="Nhập họ và tên của bạn" value={formData.fullName} onChange={handleInputChange} className="mt-3 h-12 rounded-xl bg-neutral-100" />
              </div>
              <div>
                <label className="text-base font-medium text-stone-700">Vấn Đề Khiếu Nại</label>
                <Input name="issue" placeholder="Ví dụ: Dịch vụ, Sản phẩm lỗi" value={formData.issue} onChange={handleInputChange} className="mt-3 h-12 rounded-xl bg-neutral-100" />
              </div>
              <div>
                <label className="text-base font-medium text-stone-700">Số Điện Thoại</label>
                <Input name="phone" placeholder="Nhập số điện thoại liên hệ" value={formData.phone} onChange={handleInputChange} className="mt-3 h-12 rounded-xl bg-neutral-100" />
              </div>
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-stretch">
              {/* Left side: Text editor */}
              <div className="lg:col-span-2 flex flex-col">
                <label className="text-base font-medium text-stone-700">Giải Thích Chi Tiết</label>
                <div className="mt-3 flex-grow rounded-xl bg-white p-4 shadow-[0px_0px_32px_0px_rgba(0,0,0,0.07)]">
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải..."
                    className="h-full min-h-[350px] resize-none rounded-xl bg-neutral-100 border-none focus-visible:ring-1 focus-visible:ring-red-500"
                  />
                </div>
              </div>

              {/* Right side: Image upload */}
              <div className="lg:col-span-1 flex flex-col">
                 <label className="text-base font-medium text-stone-700">Hình Ảnh Thực Tế (Nếu Có)</label>
                 <div 
                    className="mt-3 flex-grow flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current.click()}
                 >
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                    {files.length === 0 ? (
                        <div className="text-center p-4">
                            <UploadCloud className="mx-auto h-24 w-24 text-stone-700/25" />
                            <p className="mt-2 text-xs capitalize text-stone-700/75">Kéo thả ảnh vào đây, hoặc</p>
                            <Button variant="outline" type="button" className="mt-2 h-8 text-sm capitalize">Chọn ảnh</Button>
                        </div>
                    ) : (
                        <div className="p-4 w-full h-full">
                            <div className="grid grid-cols-3 gap-2">
                                {files.map((file, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <img src={file.preview} alt={file.name} className="w-full h-full object-cover rounded-md" />
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); removeFile(file); }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Submit button */}
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

export default CreateComplaint;