import React, { useState } from 'react';
import { useLoaderData, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Send, Loader2 } from 'lucide-react';
import { customFetch } from '@/utils/customAxios';
import { toast } from 'sonner';

const DetailField = ({ label, children }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="mt-1 text-base text-gray-900">{children}</div>
    </div>
);

export default function StaffComplaintDetailPage() {
    const complaint = useLoaderData();
    const navigate = useNavigate();

    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!complaint) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 p-6">
                <p className="text-xl">Không thể tải thông tin khiếu nại.</p>
                <Link to="/staff/complaints">
                    <Button>Quay lại danh sách</Button>
                </Link>
            </div>
        );
    }

    // Format date and time
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString("vi-VN", {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Function to render stars based on rating
    const renderRating = (rating) => {
        if (!rating || rating < 1) return <span className="text-gray-400">-</span>;
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} />
                ))}
            </div>
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "resolved":
                return <Badge variant="secondary" className="bg-green-500 text-white dark:bg-blue-600">Đã giải quyết</Badge>;
            case "pending":
                return <Badge variant="warning">Chờ xử lý</Badge>;
            case "rejected":
                return <Badge variant="destructive">Đã từ chối</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleResponseSubmit = async () => {
        if (!responseText.trim()) {
            toast.error("Nội dung phản hồi không được để trống.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await customFetch.patch(
                `/staff/complaints/${complaint._id}/reply`,
                { content: responseText }
            );

            if (response.data.success) {
                toast.success("Đã gửi phản hồi thành công!");
                navigate(0);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error("Gửi phản hồi thất bại", {
                description: error.message || "Đã có lỗi xảy ra."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/staff/complaints">
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Chi Tiết Khiếu Nại #{complaint._id.slice(-6)}</h1>
                </div>
            </div>

            {/* Customer & Service Info Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-medium mb-6">Thông Tin Chung</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                    <DetailField label="Mã Đơn Dịch Vụ">{complaint.so_id ? `#${complaint.so_id.toString().slice(-6)}` : 'N/A'}</DetailField>
                    <DetailField label="Tiêu đề khiếu nại">{complaint.title}</DetailField>
                    <DetailField label="Danh mục khiếu nại">{complaint.category || 'N/A'}</DetailField>
                    <DetailField label="Tên Khách Hàng">{complaint.customerName}</DetailField>
                    <DetailField label="Số Điện Thoại">{complaint.customerPhone}</DetailField>
                    <DetailField label="Xe">{`${complaint.license_plate} - ${complaint.model}`}</DetailField>
                    <DetailField label="Kỹ Thuật Viên (Dịch vụ)">{complaint.staffNames?.join(', ') || 'N/A'}</DetailField>
                    <DetailField label="Ngày Tạo Khiếu Nại">{formatDate(complaint.createdAt)}</DetailField>
                    <DetailField label="Ngày làm dịch vụ">{formatDate(complaint.serviceDate)}</DetailField>
                    <DetailField label="Trạng Thái">{getStatusBadge(complaint.status)}</DetailField>
                    <DetailField label="Đánh giá">{renderRating(complaint.rating)}</DetailField>
                </div>
            </div>

            {/* Complaint Content */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-medium mb-4">Nội dung khiếu nại</h2>
                <p className="text-base text-gray-800 whitespace-pre-wrap">{complaint.content}</p>
            </div>

            {/* Photos from Customer */}
            {complaint.photos && complaint.photos.length > 0 && (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-medium mb-6">Hình chụp thực tế (Từ Khách Hàng)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {complaint.photos.map((photoUrl, index) => (
                            <div key={index} className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                                <img src={photoUrl} alt={`Complaint photo ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-2xl font-medium text-stone-700">Ghi chú / Phản hồi cho khách</h2>

                    {complaint.reply && complaint.reply.content ? (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                className="mt-3 bg-neutral-100"
                                value={complaint.reply.content}
                                readOnly
                                disabled
                                rows={5}
                            />
                            <p className="text-sm text-gray-500">
                                Đã phản hồi lúc: {formatDate(complaint.reply.repliedAt)}
                                <span className="ml-2">
                                    (bởi {complaint.reply.staffFullName || 'N/A'})
                                </span>
                            </p>
                        </div>
                    ) : (
                        <>
                            <Textarea
                                className="mt-3 bg-neutral-100"
                                placeholder="Nhập nội dung phản hồi..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleResponseSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    {isSubmitting ? "Đang gửi..." : "Gửi Phản Hồi"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}