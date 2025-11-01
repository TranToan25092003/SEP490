import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').Timeslot} Timeslot
 * @typedef {import('./types').TimeslotWithAvailability} TimeslotWithAvailability
 * @typedef {import('./types').BookingDTO} BookingDTO
 * @typedef {import('./types').BookingSummaryDTO} BookingSummaryDTO
 * @typedef {import('./types').BookingRequest} BookingRequest
 */

/**
 * Create a new booking
 *
 * @async
 * @function createBooking
 * @param {BookingRequest} bookingData - The booking data
 * @returns {Promise<BookingDTO>} A promise that resolves to the created booking
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const booking = await createBooking({
 *     vehicleId: 'vehicle-123',
 *     serviceIds: ['service-1', 'service-2'],
 *     timeSlot: { day: 15, month: 10, year: 2025, hours: 10, minutes: 30 }
 *   });
 *   console.log(booking);
 * } catch (error) {
 *   console.error('Failed to create booking:', error);
 * }
 */
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

/**
 * Get available time slots for a specific date
 *
 * @async
 * @function getAvailableTimeSlots
 * @param {number} day - Day of the month
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<AvailableTimeSlotsResponse>} A promise that resolves to available time slots
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const { timeSlots, comment } = await getAvailableTimeSlots(15, 10, 2025);
 *   console.log(timeSlots);
 * } catch (error) {
 *   console.error('Failed to fetch time slots:', error);
 * }
 */
export const getAvailableTimeSlots = async (day, month, year) => {
  const response = await customFetch("/bookings/available-time-slots", {
    method: "GET",
    params: { day, month, year },
  });

  return response.data.data;
};

/**
 * Get a booking by ID
 *
 * @async
 * @function getBookingById
 * @param {string} bookingId - The ID of the booking to retrieve
 * @returns {Promise<BookingDTO>} A promise that resolves to the booking details
 * @throws {Error} If the API request fails or booking is not found
 *
 * @example
 * try {
 *   const booking = await getBookingById('booking-123');
 *   console.log(booking);
 * } catch (error) {
 *   console.error('Failed to fetch booking:', error);
 * }
 */
export const getBookingById = async (bookingId) => {
  const response = await customFetch(`/bookings/${bookingId}`, {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Get all bookings
 *
 * @async
 * @function getAllBookings
 * @returns {Promise<BookingSummaryDTO[]>} A promise that resolves to an array of all bookings
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const bookings = await getAllBookings();
 *   console.log(bookings);
 * } catch (error) {
 *   console.error('Failed to fetch bookings:', error);
 * }
 */
export const getAllBookings = async () => {
  const response = await customFetch("/bookings/all", {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Check in a booking when customer arrives
 *
 * @async
 * @function checkInBooking
 * @param {string} bookingId - The ID of the booking to check in
 * @returns {Promise<{
 *   serviceOrderId: string
 * }>} A promise that resolves to the checked-in booking details
 * @throws {Error} If the API request fails or booking cannot be checked in
 *
 * @example
 * try {
 *   const booking = await checkInBooking('booking-123');
 *   console.log('Booking checked in:', booking);
 * } catch (error) {
 *   console.error('Failed to check in booking:', error);
 * }
 */
export const checkInBooking = async (bookingId) => {
  const response = await customFetch(`/bookings/${bookingId}/check-in`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Cancel a booking
 *
 * @async
 * @function cancelBooking
 * @param {string} bookingId - The ID of the booking to cancel
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails or booking cannot be cancelled
 *
 * @example
 * try {
 *   const booking = await cancelBooking('booking-123');
 *   console.log('Booking cancelled:', booking);
 * } catch (error) {
 *   console.error('Failed to cancel booking:', error);
 * }
 */
export const cancelBooking = async (bookingId) => {
  await customFetch(`/bookings/${bookingId}/cancel`, {
    method: "POST",
  });
};
