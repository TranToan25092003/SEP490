import { FormProvider, useForm } from "react-hook-form";
import { useState } from "react";
import { BookingHeader, BookingComment, BookingServices, BookingTotal } from ".";

/**
 * @typedef {import("./index").BookingFormProps} BookingFormProps
 */

/**
 * @param {BookingFormProps} props
 */
const BookingForm = ({
  booking,
  onUpdateBooking,
  onConfirmBooking
}) => {
  const [updateBookingLoading, setUpdateBookingLoading] = useState(false);
  const [confirmBookingLoading, setConfirmBookingLoading] = useState(false);

  const methods = useForm({
    defaultValues: {
      ...booking
    }
  });

  const handleUpdateBooking = async (data) => {
    try {
      setUpdateBookingLoading(true);
      await onUpdateBooking(data);
    } finally {
      setUpdateBookingLoading(false);
    }
  };

  const handleConfirmBooking = async (data) => {
    try {
      setConfirmBookingLoading(true);
      await onConfirmBooking(data);
    } finally {
      setConfirmBookingLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="grid grid-cols-1 lg:grid-cols-3 gap-3"
        onSubmit={methods.handleSubmit(handleUpdateBooking)}
      >
        <BookingHeader confirmBookingLoading={confirmBookingLoading} className="lg:col-span-3" booking={booking} />
        <BookingServices />
        <BookingComment />
        <BookingTotal updateBookingLoading={updateBookingLoading} onUpdateServices={handleConfirmBooking} />
      </form>
    </FormProvider>
  );
};

export default BookingForm;
