import { Suspense } from "react";
import { Await, Link, useLoaderData } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Calendar, Car, Clock, LogIn } from "lucide-react";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { getUserBookings } from "@/api/bookings";
import clerk from "@/utils/clerk";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (start, end) => {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getHours().toString().padStart(2, "0")}:${s
    .getMinutes()
    .toString()
    .padStart(2, "0")} - ${e.getHours().toString().padStart(2, "0")}:${e
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export function loader() {
  if (!clerk.isSignedIn) {
    return {
      bookingsPromise: Promise.resolve([]),
    };
  }

  return {
    bookingsPromise: getUserBookings(),
  };
}

const BookingList = ({ bookings }) => {
  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Bạn chưa có lịch hẹn nào. Hãy tạo đặt lịch mới!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Link
          to={`/booking/${booking.id}`}
          key={booking.id}
          className="block group"
        >
          <Card className="transition-all group-hover:border-primary group-hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mã đơn: {booking.id}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {booking.vehicle?.licensePlate || "Biển số: N/A"}
                </p>
              </div>
              <Badge variant="outline">
                {translateBookingStatus(booking.status)}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Car className="size-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Phương tiện</p>
                  <p className="font-semibold">
                    {booking.vehicle?.brand || "N/A"}{" "}
                    {booking.vehicle?.model || ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Năm {booking.vehicle?.year || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày hẹn</p>
                  <p className="font-semibold">
                    {formatDate(booking.slotStartTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="size-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Khung giờ</p>
                  <p className="font-semibold">
                    {formatTime(booking.slotStartTime, booking.slotEndTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

const BookingTracking = () => {
  const { bookingsPromise } = useLoaderData();

  return (
    <Container className="space-y-6 my-8">
      <div className="flex items-center justify-between">
        <H3>Theo Dõi Đơn Dịch Vụ</H3>
        <Button asChild>
          <Link to="/booking">Đặt lịch mới</Link>
        </Button>
      </div>

      <SignedIn>
        <Suspense
          fallback={
            <div className="flex justify-center py-10">
              <Spinner className="size-8" />
            </div>
          }
        >
          <Await
            resolve={bookingsPromise}
            errorElement={
              <Card>
                <CardContent className="py-10 text-center text-destructive">
                  Không thể tải danh sách đặt lịch. Vui lòng thử lại sau.
                </CardContent>
              </Card>
            }
          >
            {(bookings) => <BookingList bookings={bookings} />}
          </Await>
        </Suspense>
      </SignedIn>

      <SignedOut>
        <Card className="py-12 text-center space-y-4">
          <LogIn className="mx-auto size-10 text-primary" />
          <p className="text-lg font-semibold">
            Hãy đăng nhập để xem tiến độ các đơn đặt lịch của bạn
          </p>
          <Button asChild>
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </Card>
      </SignedOut>
    </Container>
  );
};

BookingTracking.loader = loader;

export default BookingTracking;

