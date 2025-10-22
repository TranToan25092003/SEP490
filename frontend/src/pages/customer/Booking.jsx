import BookingHeader from "@/components/customer/booking/BookingHeader";
import BookingForm from "@/components/customer/booking/BookingForm";
import { toast } from "sonner";
import { useLoaderData, Await } from "react-router-dom";
import Container from "@/components/global/Container";
import { getServices } from "@/api/services";
import { createBooking, getAvailableTimeSlots } from "@/api/bookings";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export function loader() {
  return {
    services: getServices(),
    vehicles: getVehicles(),
  }
}

const BookingFormSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary-600" />
    </div>
  );
}

const BookingFormError = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <p className="text-center text-red-600">Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
    </div>
  );
}

const Booking = () => {
  const { services } = useLoaderData();

  const handleSubmit = async (data) => {
    try {
      const bookingRequest = {
        vehicleId: data.vehicle.id,
        serviceIds: data.services.map(service => service.sid),
        timeSlot: {
          day: data.timeslot.day,
          month: data.timeslot.month,
          year: data.timeslot.year,
          hours: data.timeslot.hours,
          minutes: data.timeslot.minutes,
        },
      };

      const result = await createBooking(bookingRequest);
      console.log("Booking created:", result);
      toast.success("Đặt lịch thành công!");
    } catch (error) {
      if (error.response?.errorCode) {
        toast.error(error.response.message);
      }

      throw error;
    }
  };

  const fetchAvailableTimeSlots = async (day, month, year) => {
    const data = await getAvailableTimeSlots(day, month, year);
    return data;
  }

  return (
    <Container className="space-y-14 my-8">
      <BookingHeader />

      <Suspense fallback={<BookingFormSkeleton />}>
        <Await resolve={services} errorElement={<BookingFormError />}>
          {(services) => (
            <BookingForm
              className="max-w-6xl mx-auto"
              onSubmit={handleSubmit}
              vehicles={mockVehicles}
              services={services.map(s => ({
                sid: s.id,
                name: s.name,
                estimatedTime: s.estimatedTimeInMinutes,
                basePrice: s.basePrice,
                desc: s.description,
              }))}
              fetchAvailableTimeSlots={fetchAvailableTimeSlots}
            />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

Booking.loader = loader;

export default Booking;
