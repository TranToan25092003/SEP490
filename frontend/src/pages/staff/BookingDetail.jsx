import { useState } from "react";
import Container from "@/components/global/Container";
import {
  BookingForm
} from "@/components/staff/booking-detail";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";

const BookingDetail = () => {
  const [booking, setBooking] = useState({
    id: "WO-DRAFT-0007",
    customerName: "Nguyễn Văn A",
    licensePlate: "59f-123.45- Altis 2019",
    vehicleModel: "Altis 2019",
    fixTechnician: { id: "1", name: "Nguyễn Văn A" },
    bayTechnician: { id: "2", name: "Trần Văn B" },
    services: [
      { sid: "1", name: "Thay dầu", basePrice: 399000 },
      { sid: "2", name: "Kiểm tra phanh", basePrice: 250000 }
    ],
    comment: ""
  });

  const handleUpdateBooking = async (updatedData) => {
    await new Promise((resolve, _) => setTimeout(resolve, 4000));
    console.log("Updating booking:", updatedData);
  };

  const handleConfirmBooking = async (bookingData) => {
    await new Promise((resolve, _) => setTimeout(resolve, 4000));
    console.log("Confirming booking:", bookingData);
  };

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/booking" label="Quay lại trang quản lý lệnh" />
      <H3>Chi Tiết Lệnh Sửa Chữa</H3>

      <BookingForm
        booking={booking}
        getTotalPrice={async (services) => {
          await new Promise((resolve, _) => setTimeout(resolve, 500));
          const sum = services.reduce((acc, x) => acc + x.basePrice, 0);
          return {
            price: sum,
            tax: sum * 0.1,
            total: 1.1 * sum
          };
        }}
        onConfirmBooking={handleConfirmBooking}
        onUpdateBooking={handleUpdateBooking}
      />
    </Container>
  );
};

export default BookingDetail;
