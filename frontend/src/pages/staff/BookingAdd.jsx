import BackButton from "@/components/global/BackButton";
import Container from "@/components/global/Container";
import { BookingAddForm } from "@/components/staff/booking-add";
import { H3 } from "@/components/ui/headings";
import { useState } from "react";

const BookingAdd = () => {
  return (
    <Container pageContext="admin">
      <BackButton to="/staff/booking" label="Quay lại trang quản lý lệnh" />
      <H3>Thêm Lệnh Sửa Chữa Mới</H3>

      <BookingAddForm
        services={[
          { sid: "1", name: "Thay dầu", basePrice: 399000, description: "" },
          { sid: "2", name: "Kiểm tra phanh", basePrice: 250000, description: "" },
          { sid: "3", name: "Vệ sinh nội thất", basePrice: 150000, description: "" },
        ]}
        onSubmit={async (data) => {
          console.log(data);
        }}
      />
    </Container>
  );
};

BookingAdd.displayName = "BookingAdd";

export default BookingAdd;
