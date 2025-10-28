import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {Object} TimeSlot
 * @property {number} day - Day of the month
 * @property {number} month - Month (1-12)
 * @property {number} year - Year
 * @property {number} hours - Hour (0-23)
 * @property {number} minutes - Minutes (0-59)
 */

/**
 * @typedef {Object} BookingRequest
 * @property {string} vehicleId - Vehicle ID for the booking
 * @property {string[]} serviceIds - Array of service IDs
 * @property {TimeSlot} timeSlot - The booking time slot
 * @property {string} [userIdToBookFor] - Optional user ID to book for (defaults to current user)
 */

/**
 * @typedef {Object} Booking
 * @property {string} id - The unique identifier for the booking
 */

/**
 * @typedef {Object} BookingDetails
 * @property {string} id - The unique identifier for the booking
 * @property {Object} customer - Customer information
 * @property {string} customer.customerName - Customer name
 * @property {Object} vehicle - Vehicle information
 * @property {string} vehicle.licensePlate - Vehicle license plate
 * @property {Object} bay - Bay information
 * @property {string} bay.bayName - Bay name/number
 * @property {Array<Object>} technicians - Array of technician information
 * @property {string} technicians[].technicianName - Technician name
 * @property {string} expectedStartTime - Expected start time
 * @property {string} startedAt - Actual start time
 * @property {string} completedAt - Completion time
 * @property {string} cancelledAt - Cancellation time
 * @property {string} status - The booking status (e.g., "pending", "confirmed", "cancelled")
 * @property {Array<Object>} services - Array of services
 */

/**
 * @typedef {Object} TimeSlotInfo
 * @property {number} hours - Hour (0-23)
 * @property {number} minutes - Minutes (0-59)
 * @property {number} day - Day of the month
 * @property {number} month - Month (1-12)
 * @property {number} year - Year
 * @property {boolean} isAvailable - Whether the time slot is available
 */

/**
 * @typedef {Object} AvailableTimeSlotsResponse
 * @property {TimeSlotInfo[]} timeSlots - Array of available time slots
 * @property {string} comment - Additional comment or instruction
 */

/**
 * Create a new booking
 *
 * @async
 * @function createBooking
 * @param {BookingRequest} bookingData - The booking data
 * @returns {Promise<Booking>} A promise that resolves to the created booking
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
  const response = await customFetch("/client/bookings/create", {
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
  const response = await customFetch("/client/bookings/available-time-slots", {
    method: "GET",
    params: { day, month, year },
  });

  return response.data.data;
};
