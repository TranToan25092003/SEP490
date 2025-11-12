import React from 'react';
// Import hình ảnh nền (giả sử đường dẫn này đúng)
import statsBg from '@/assets/stats-bg.jpg';

export default function AdminDashboardPage() {
    return (
        // Sử dụng h-[calc(100vh-80px)] để lấp đầy chiều cao còn lại (80px là chiều cao của TopMenu)
        <div className="relative flex flex-col items-center justify-center h-[calc(100vh-80px)] p-8 text-white overflow-hidden">

            {/* Hình ảnh nền */}
            <img
                src={statsBg}
                alt="Admin Background"
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Lớp phủ màu đen mờ để làm rõ chữ */}
            <div className="absolute inset-0 bg-black/60 z-0"></div>

            {/* Nội dung chính (phải có z-10 để nổi lên trên lớp phủ) */}
            <div className="relative z-10 text-center max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-wide">
                    Chào mừng đến trang Admin
                </h1>
                <p className="mt-6 text-lg text-white/80">
                    Đây là trang trung tâm điều khiển và quản lý hệ thống. Trang này giúp đội ngũ Admin quản lý: Dịch vụ trong
                    hệ thống, Mẫu xe trong hệ thống, Banner trong hệ thống, Nhân viên trong hệ thống.
                </p>
            </div>

        </div>
    );
}