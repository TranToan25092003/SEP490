import { useState } from "react";
import Container from "@/components/global/Container";
import {
  BookingForm
} from "@/components/staff/booking-detail";
import { Label } from "@/components/ui/label";

const BookingDetail = () => {
  const [booking, setBooking] = useState({
    id: "WO-DRAFT-0007",
    customerName: "Nguyễn Văn A",
    licensePlate: "59f-123.45- Altis 2019",
    vehicleModel: "Altis 2019",
    fixTechnician: { id: "1", name: "Nguyễn Văn A" },
    bayTechnician: { id: "2", name: "Trần Văn B" },
    services: [
      { sid: "1", name: "Thay dầu", price: 399000 },
      { sid: "2", name: "Kiểm tra phanh", price: 250000 }
    ],
    comment: ""
  });

  const handleUpdateBooking = async (updatedData) => {
    console.log("Updating booking:", updatedData);
  };

  const handleConfirmBooking = async (bookingData) => {
    console.log("Confirming booking:", bookingData);
  };

  return (
    <Container className="py-6">
      <Label className="mb-4 text-2xl font-bold">Chi Tiết Lệnh Sửa Chữa</Label>
      <BookingForm
        booking={booking}
        getTotalPrice={(services) => {
          return 100;
        }}
        onConfirmBooking={handleConfirmBooking}
        onUpdateBooking={handleUpdateBooking}
      />
    </Container>
  );
};

export default BookingDetail;
