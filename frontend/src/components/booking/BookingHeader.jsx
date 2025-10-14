import { memo } from "react";
import bookingBikePng from "@/assets/booking-bike.png";

const BookingHeader = memo(() => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          <span className="text-gray-800">Đăng ký dịch vụ</span>
          <br />
          <span className="text-red-600">MotorMate</span>
        </h1>

        <div className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg inline">
          Đăng kí ngay bên dưới
        </div>
      </div>

      <div className="bg-gradient-to-r from-white via-red-50 to-red-600 rounded-xl">
        <img src={bookingBikePng} alt="Booking Bike" className="relative top-10 left-10" />
      </div>
    </div>
  );
});

BookingHeader.displayName = "BookingHeader";

export default BookingHeader;
