import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UploadCloud } from 'lucide-react';
import photoPlaceholder from '@/assets/mission-image.jpg'; 

// --- Mock Data (to be replaced by loader) ---
const mockComplaintDetail = {
    _id: "complaint001",
    title: "Kỹ Thuật",
    content: "Sau khi thay nhớt phuộc trước ngày 28/9, sáng nay thấy vệt dầu dưới xe, phuộc trái có vẻ ấm dầu",
    photos: [photoPlaceholder, photoPlaceholder, photoPlaceholder],
    status: "pending",
    createdAt: "2025-10-28T10:00:00.000Z",
    so_id: {
        _id: "so001",
        staff_id: [{ name: "Phạm B" }],
        booking_id: {
            clerkId: {
                name: "Nguyễn Văn A",
                phone: "09xx xxx xxx"
            },
        },
        vehicle_id: {
            license_plate: "59F-123.45",
            model_id: {
                name: "Altis",
                year: 2019
            }
        },
        bay_id: {
            branch_id: {
                name: "HÀ NỘI"
            }
        }
    },
};
// --- End Mock Data ---

// Helper component for displaying detail fields
const DetailField = ({ label, value }) => (
    <div>
        <p className="text-base font-normal text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
);

export default function StaffComplaintDetail() {
    // const complaint = useLoaderData(); // Use this when loader is ready
    const complaint = mockComplaintDetail; // Using mock data for now

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
                    <h1 className="text-3xl font-bold text-gray-800">Quản lý Khiếu nại</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="destructive" className="bg-pink-900 hover:bg-pink-800">Duyệt</Button>
                    <Button variant="secondary" className="bg-neutral-900 text-white hover:bg-neutral-800">Huỷ</Button>
                </div>
            </div>

            {/* Customer Info Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-medium mb-6">Khách Gửi</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                    <DetailField label="Loại Khiếu nại" value={complaint.title} />
                    <DetailField label="Tên Khách Hàng" value={complaint.so_id.booking_id.clerkId.name} />
                    <DetailField label="Xe" value={`${complaint.so_id.vehicle_id.license_plate} - ${complaint.so_id.vehicle_id.model_id.name} ${complaint.so_id.vehicle_id.model_id.year}`} />
                    <DetailField label="Chi Nhánh" value={complaint.so_id.bay_id.branch_id.name} />
                    <DetailField label="Kỹ Thuật Viên" value={complaint.so_id.staff_id[0].name} />
                    <DetailField label="Số điện thoại" value={complaint.so_id.booking_id.clerkId.phone} />
                </div>
            </div>

            {/* Complaint Content */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <p className="text-lg text-gray-800">{complaint.content}</p>
            </div>

            {/* Photos from Customer */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-medium mb-6">Hình chụp thực tế</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {complaint.photos.map((photo, index) => (
                        <div key={index} className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                            <img src={photo} alt={`Complaint photo ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Response Section */}
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-2xl font-medium text-stone-700">Note nội dung cho khách</h2>
                    <Textarea className="mt-3 bg-neutral-100" placeholder="Nhập nội dung phản hồi..." />
                </div>
                <div>
                    <h2 className="text-2xl font-medium text-stone-700">Hình ảnh (Nếu có)</h2>
                    <div className="mt-3 flex justify-center items-center w-full md:w-72 h-60 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-100">
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-stone-700/25" />
                            <p className="mt-2 text-xs text-stone-700/75">Drop image here, paste or</p>
                            <Button variant="outline" className="mt-2 text-sm capitalize h-8">Chọn</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}