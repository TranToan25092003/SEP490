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
  onConfirmBooking,
  getTotalPrice
}) => {
  const [updateBookingLoading, setUpdateBookingLoading] = useState(false);
  const [confirmBookingLoading, setConfirmBookingLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const methods = useForm({
    defaultValues: {
      ...booking
    }
  });

  const handleUpdateBooking = async (data) => {
    try {
      setUpdateBookingLoading(true);
      setDisabled(true);
      await onUpdateBooking(data);
    } finally {
      setDisabled(false);
      setUpdateBookingLoading(false);
    }
  };

  const handleConfirmBooking = async (data) => {
    try {
      setConfirmBookingLoading(true);
      setDisabled(true);
      await onConfirmBooking(data);
    } finally {
      setDisabled(false);
      setConfirmBookingLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="grid grid-cols-1 lg:grid-cols-5 gap-3"
        onSubmit={methods.handleSubmit(handleConfirmBooking)}
      >
        <BookingHeader
          confirmBookingLoading={confirmBookingLoading}
          className="lg:col-span-5"
          booking={booking}
          disabled={disabled}
        />
        <BookingServices className="lg:col-span-2" disabled={disabled} />
        <BookingComment className="lg:col-span-1" disabled={disabled} />
        <BookingTotal
          className="lg:col-span-2"
          getTotalPrice={getTotalPrice}
          updateBookingLoading={updateBookingLoading}
          disabled={disabled}
          onUpdateServices={() => handleUpdateBooking(methods.getValues())}
        />
      </form>
    </FormProvider>
  );
};

export default BookingForm;
