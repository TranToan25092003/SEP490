import { customFetch } from "@/utils/customAxios";

export const createBooking = async (bookingData) => {
  const response = await customFetch("/bookings/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: bookingData,
  });

  return response.data;
};

export const getUserBookings = async () => {
  const response = await customFetch("/bookings/me", {
    method: "GET",
  });

  return response.data.data;
}

export const getAvailableTimeSlots = async (day, month, year) => {
  const response = await customFetch("/bookings/available-time-slots", {
    method: "GET",
    params: { day, month, year },
  });

  return response.data.data;
};

export const getBookingById = async (bookingId) => {
  const response = await customFetch(`/bookings/${bookingId}`, {
    method: "GET",
  });

  return response.data.data;
};

export const getAllBookings = async ({
  page = 1,
  limit = 20,
  customerName = null,
  status = null,
  startTimestamp = null,
  endTimestamp = null,
}) => {
  const response = await customFetch("/bookings/all", {
    method: "GET",
    params: {
      page,
      limit,
      customerName,
      status,
      startTimestamp,
      endTimestamp,
    },
  });

  return response.data.data;
};

export const checkInBooking = async (bookingId) => {
  const response = await customFetch(`/bookings/${bookingId}/check-in`, {
    method: "POST",
  });

  return response.data.data;
};

export const cancelBooking = async (bookingId) => {
  await customFetch(`/bookings/${bookingId}/cancel`, {
    method: "POST",
  });
};
