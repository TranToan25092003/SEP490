// The DTOs will become Swagger definitions and client API models

/**
 * @typedef {object} Timeslot
 * @property {number} day - Day of the week (0-6, where 0 is Sunday).
 * @property {number} month - Month of the year (1-12).
 * @property {number} year - Full year (e.g., 2024).
 * @property {number} hours - Hour of the day (0-23).
 * @property {number} minutes - Minutes of the hour (0-59).
 */

/**
 * @typedef {Timeslot | { isAvailable: boolean }} TimeslotWithAvailability
 */

/**
 * @typedef {object} BookingDTO
 * @property {string} id - Booking identifier.
 * @property {{
 *   customerClerkId: string,
 *   customerName: string
 * }} customer - Information about the customer who made the booking.
 * @property {VehicleDTO} vehicle - Information about the vehicle for the booking.
 * @property {Array<ServiceDTO>} services - Array of services included in the booking.
 * @property {Date} slotStartTime - Start time of the booking slot.
 * @property {Date} slotEndTime - End time of the booking slot.
 * @property {string} status - Status of the booking (e.g., "booked", "in_progress").
 * @property {string} [serviceOrderId] - ID of the associated service order, if any.
 */

/**
 * @typedef {object} BookingSummaryDTO
 * @property {string} id - Booking identifier.
 * @property {string} customerName - Name of the customer who made the booking.
 * @property {Array<string>} services - Array of service names included in the booking.
 * @property {Date} slotStartTime - Start time of the booking slot.
 * @property {Date} slotEndTime - End time of the booking slot.
 * @property {string} status - Status of the booking (e.g., "booked", "cancelled").
 * @property {string} [serviceOrderId] - ID of the associated service order, if any.
 */

/**
 * @typedef {object} ServiceDTO
 * @property {string} id - Service identifier.
 * @property {string} name - Name of the service.
 * @property {number} basePrice - Base price of the service.
 * @property {string} description - Description of the service.
 * @property {number} estimatedTimeInMinutes - Estimated time to complete the service in minutes.
 */

/**
 * @typedef {object} VehicleDTO
 * @property {string} id - Vehicle identifier.
 * @property {string} licensePlate - License plate number of the vehicle.
 * @property {number} odoReading - Odometer reading of the vehicle.
 * @property {number} year - Manufacturing year of the vehicle.
 * @property {string} brand - Brand of the vehicle.
 * @property {string} model - Model name of the vehicle.
 */

/**
 * @typedef {VehicleDTO | { isAvailable: boolean }} VehicleWithAvailabilityDTO
 */

module.exports = {};
