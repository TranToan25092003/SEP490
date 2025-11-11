import BookingStatusHeader from "@/components/customer/booking-progress/BookingStatusHeader";
import BookingStatusTimeline from "@/components/customer/booking-progress/BookingStatusTimeline";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { useLoaderData, useParams, Link, Await } from "react-router-dom";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { getBookingById } from "@/api/bookings";
import { getAllTasksForServiceOrder } from "@/api/serviceTasks";

function loader({ params }) {
  return {
    bookingPromise: getBookingById(params.id).then(async (booking) => {
      if (booking.serviceOrderId) {
        const tasks = await getAllTasksForServiceOrder(booking.serviceOrderId);
        return { booking, tasks };
      }
      return { booking, tasks: [] };
    })
  };
}

const BookingProgressContent = ({ data }) => {
  const { booking, tasks } = data;

  return (
    <>
      <BookingStatusHeader
        bookingId={booking.id || "N/A"}
        customerName={booking.customer.customerName || "N/A"}
        licensePlate={booking.vehicle.licensePlate || "N/A"}
        technicianName="Đang cập nhật"
        status={booking.status || "N/A"}
        creationDate={booking.createdAt ? new Date(booking.createdAt) : new Date()}
        estimatedTime={booking.slotStartTime ? new Date(booking.slotStartTime) : new Date()}
      />

      <BookingStatusTimeline
        booking={booking}
        tasks={tasks || []}
        className="min-h-[600px]"
      />
    </>
  );
};

const BookingProgress = () => {
  const { bookingPromise } = useLoaderData();
  const { id } = useParams();

  return (
    <Container className="space-y-4 my-8">
      <div className="flex justify-between items-center">
        <H3>CHI TIẾT ĐƠN</H3>
        <Tabs value="progress">
          <TabsList>
            <TabsTrigger value="progress">
              <Link to={`/booking/${id}`}>
                Tiến độ
              </Link>
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <Link to={`/booking/${id}/quotes`}>
                Báo giá
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      }>
        <Await
          resolve={bookingPromise}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải thông tin đặt lịch
            </div>
          }
        >
          {(data) => (
            <BookingProgressContent data={data} />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

BookingProgress.loader = loader;

export default BookingProgress;
