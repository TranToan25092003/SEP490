import BookingStatusHeader from "@/components/customer/booking-progress/BookingStatusHeader";
import BookingStatusTimeline from "@/components/customer/booking-progress/BookingStatusTimeline";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Card } from "@/components/ui/card";
import background from "@/assets/cool-motorcycle-indoors.png";
import {
  useLoaderData,
  useParams,
  Link,
  Await,
  useNavigate,
} from "react-router-dom";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBookingById } from "@/api/bookings";
import { getAllTasksForServiceOrder } from "@/api/serviceTasks";
import { ArrowLeft } from "lucide-react";

function loader({ params }) {
  return {
    bookingPromise: getBookingById(params.id).then(async (booking) => {
      if (booking.serviceOrderId) {
        const tasks = await getAllTasksForServiceOrder(booking.serviceOrderId);
        return { booking, tasks };
      }
      return { booking, tasks: [] };
    }),
  };
}

const BookingProgressContent = ({ data }) => {
  const { booking, tasks } = data;

  return (
    <>
      <hr className="border-t border-gray-200 my-0" />
      <div className="px-4 md:px-6 py-4 md:py-6">
        <BookingStatusHeader
          bookingId={booking.id || "N/A"}
          customerName={booking.customer.customerName || "N/A"}
          licensePlate={booking.vehicle.licensePlate || "N/A"}
          status={booking.status || "N/A"}
          serviceOrderStatus={booking.serviceOrderStatus || null}
          creationDate={
            booking.createdAt ? new Date(booking.createdAt) : new Date()
          }
        />
      </div>

      <hr className="border-t border-gray-200 my-0" />
      <div className="px-4 md:px-6 py-4 md:py-6">
        <BookingStatusTimeline
          booking={booking}
          tasks={tasks || []}
          className="min-h-[600px]"
        />
      </div>
    </>
  );
};

const BookingProgress = () => {
  const { bookingPromise } = useLoaderData();
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div
      className="w-full min-h-screen flex justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <Container className="my-8 w-full max-w-7xl">
        <Card className="p-0">
          <div className="p-4 md:p-6">
            <button
              type="button"
              onClick={() => navigate("/booking-tracking")}
              className="inline-flex items-center gap-2 text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 transition-colors border border-gray-200 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                Quay lại danh sách tiến độ sửa xe
              </span>
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <H3 className="text-gray-900 m-0">CHI TIẾT ĐƠN</H3>
              <Tabs value="progress">
                <TabsList>
                  <TabsTrigger value="progress">
                    <Link to={`/booking/${id}`}>Tiến độ</Link>
                  </TabsTrigger>
                  <TabsTrigger value="quotes">
                    <Link to={`/booking/${id}/quotes`}>Báo giá</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex bg-white justify-center items-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            }
          >
            <Await
              resolve={bookingPromise}
              errorElement={
                <div className="text-center py-8 text-destructive">
                  Không thể tải thông tin đặt lịch
                </div>
              }
            >
              {(data) => <BookingProgressContent data={data} />}
            </Await>
          </Suspense>
        </Card>
      </Container>
    </div>
  );
};

BookingProgress.loader = loader;

export default BookingProgress;
