import BookingStatusHeader from "@/components/booking-progress/BookingStatusHeader";
import BookingStatusTimeline from "@/components/booking-progress/BookingStatusTimeline";
import Container from "@/components/global/Container";

const mockOrderData = {
  orderId: "WO-20250110-0007",
  customerName: "Nguyễn Văn A",
  licensePlate: "59I-123.45 - Altis 2019",
  technicianName: "Phạm B",
  status: "Đang Sửa",
  branch: "Hà Nội",
  creationDate: new Date("2025-10-06T09:10:00"),
  estimatedTime: new Date("2025-10-06T09:10:00"),
};

const mockTimelineSteps = [
  {
    id: 1,
    label: "Tiếp nhận",
    time: "09:10",
    imageUrls: [
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
    ],
  },
  {
    id: 2,
    label: "Chẩn đoán",
    time: "09:10",
    imageUrls: [
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
    ],
  },
  {
    id: 3,
    label: "Chờ duyệt",
    time: "09:10",
    imageUrls: [],
  },
  {
    id: 4,
    label: "Đang sửa",
    time: "09:10",
    imageUrls: [
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
    ],
  },
  {
    id: 5,
    label: "QC/Rửa xe",
    time: "09:10",
     imageUrls: ["https://picsum.photos/200/300"],
  },
  {
    id: 6,
    label: "Hoàn Tất",
    time: "09:10",
    imageUrls: [
      "https://picsum.photos/200/300",
      "https://picsum.photos/200/300",
    ],
  },
];

const BookingProgress = () => {
  return (
    <Container className="space-y-4 my-8">
      <h1 className="text-3xl font-bold text-primary">THEO DÕI TIẾN ĐỘ</h1>

      <BookingStatusHeader
        orderId={mockOrderData.orderId}
        customerName={mockOrderData.customerName}
        licensePlate={mockOrderData.licensePlate}
        technicianName={mockOrderData.technicianName}
        status={mockOrderData.status}
        creationDate={mockOrderData.creationDate}
        estimatedTime={mockOrderData.estimatedTime}
      />

      <BookingStatusTimeline
        className="min-h-[600px]"
        currentStep={3}
        steps={mockTimelineSteps}
      />
    </Container>
  );
};

export default BookingProgress;
