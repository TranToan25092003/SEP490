import { FormProvider, useForm } from "react-hook-form";
import { useState } from "react";
import { BookingHeader, BookingComment, BookingServices, BookingTotal } from ".";

/**
 * BookingEditForm Component
 * A form component for editing and managing booking details including services, comments, and confirmation.
 *
 * @typedef {import("./index").BookingEditFormProps} BookingEditFormProps
 */

/**
 * Renders a booking edit form with service management and booking confirmation capabilities.
 *
 * @component
 * @param {BookingEditFormProps} props - The component props
 * @returns {JSX.Element} The rendered booking edit form
 */
const BookingEditForm = ({
  booking,
  onUpdateBooking,
  onConfirmBooking,
  onSendInvoice,
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

  const handleSendInvoice = async (data) => {
    try {
      setUpdateBookingLoading(true);
      setDisabled(true);
      await onSendInvoice(data);
    } finally {
      setDisabled(false);
      setUpdateBookingLoading(false);
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
          onSendInvoice={() => handleSendInvoice(methods.getValues())}
          onUpdateServices={() => handleUpdateBooking(methods.getValues())}
        />
      </form>
    </FormProvider>
  );
};

export default BookingEditForm;
