import BookingHeader from "@/components/booking/BookingHeader";
import BookingForm from "@/components/booking/BookingForm";
import { toast } from "sonner";
import Container from "@/components/global/Container";

const services = [
  {
    sid: "1",
    name: "Thay dầu động cơ",
    basePrice: 500000,
    desc: "Thay dầu động cơ và lọc dầu",
    estimatedTime: 30,
  },
  {
    sid: "2",
    name: "Bảo dưỡng định kỳ",
    basePrice: 1000000,
    desc: "Kiểm tra toàn bộ hệ thống xe",
    estimatedTime: 120,
  },
  {
    sid: "3",
    name: "Thay lốp xe",
    basePrice: 2000000,
    desc: "Thay 4 lốp xe mới",
    estimatedTime: 60,
  },
  {
    sid: "4",
    name: "Kiểm tra phanh",
    basePrice: 300000,
    desc: "Kiểm tra và điều chỉnh hệ thống phanh",
    estimatedTime: 45,
  },
];

const Booking = () => {
  const myCar = {
    licensePlate: "30A-12345",
  };

  const fetchAvailableTimeSlots = async (day, month, year) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timeSlots = [];
        const startHour = 8;
        const endHour = 17;

        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const isAvailable = Math.random() > 0.3; // Random availability
            timeSlots.push({
              hours: hour,
              minutes: minute,
              day,
              month,
              year,
              isAvailable,
            });
          }
        }

        resolve({
          timeSlots,
          comment: "Vui lòng đến trước giờ hẹn 10 phút.",
        });
      }, 1000);
    });
  };

  const handleSubmit = async (data) => {
    console.log("Booking data:", data);

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });

    toast.success("Đặt lịch thành công!");
  };

  return (
    <Container className="space-y-14 my-8">
      <BookingHeader />

      <BookingForm
        className="max-w-6xl mx-auto"
        onSubmit={handleSubmit}
        myCar={myCar}
        services={services}
        fetchAvailableTimeSlots={fetchAvailableTimeSlots}
      />
    </Container>
  );
};

export default Booking;
