/**
 * @fileoverview API type definitions converted from backend Swagger schemas
 * These types represent the data structures used across the API
 */

/**
 * @typedef {Object} Timeslot
 * @property {number} day - Day of the week (0-6, where 0 is Sunday)
 * @property {number} month - Month of the year (1-12)
 * @property {number} year - Full year (e.g., 2024)
 * @property {number} hours - Hour of the day (0-23)
 * @property {number} minutes - Minutes of the hour (0-59)
 */

/**
 * @typedef {Object} TimeslotWithAvailability
 * @property {number} day - Day of the week (0-6, where 0 is Sunday)
 * @property {number} month - Month of the year (1-12)
 * @property {number} year - Full year (e.g., 2024)
 * @property {number} hours - Hour of the day (0-23)
 * @property {number} minutes - Minutes of the hour (0-59)
 * @property {boolean} isAvailable - Whether the timeslot is available
 */

/**
 * @typedef {Object} ServiceDTO
 * @property {string} id - Service identifier
 * @property {string} name - Name of the service
 * @property {number} basePrice - Base price of the service
 * @property {string} description - Description of the service
 * @property {number} estimatedTimeInMinutes - Estimated time to complete the service in minutes
 */

/**
 * @typedef {Object} VehicleDTO
 * @property {string} id - Vehicle identifier
 * @property {string} licensePlate - License plate number of the vehicle
 * @property {number} odoReading - Odometer reading of the vehicle
 * @property {number} year - Manufacturing year of the vehicle
 * @property {string} brand - Brand of the vehicle
 * @property {string} model - Model name of the vehicle
 */

/**
 * @typedef {Object} VehicleWithAvailabilityDTO
 * @property {string} id - Vehicle identifier
 * @property {string} licensePlate - License plate number of the vehicle
 * @property {number} odoReading - Odometer reading of the vehicle
 * @property {number} year - Manufacturing year of the vehicle
 * @property {string} brand - Brand of the vehicle
 * @property {string} model - Model name of the vehicle
 * @property {boolean} isAvailable - Availability status of the vehicle
 */

/**
 * @typedef {Object} BookingCustomer
 * @property {string} customerClerkId - Clerk ID of the customer
 * @property {string} customerName - Name of the customer who made the booking
 */

/**
 * @typedef {Object} BookingDTO
 * @property {string} id - Booking identifier
 * @property {BookingCustomer} customer - Customer information
 * @property {VehicleDTO} vehicle - Vehicle information
 * @property {ServiceDTO[]} services - Array of services included in the booking
 * @property {string} slotStartTime - Start time of the booking slot (ISO 8601 format)
 * @property {string} slotEndTime - End time of the booking slot (ISO 8601 format)
 * @property {string} status - Status of the booking (e.g., "booked", "in_progress", "completed", "cancelled")
 * @property {string} [serviceOrderId] - ID of the associated service order, if any
 */

/**
 * @typedef {Object} BookingSummaryDTO
 * @property {string} id - Booking identifier
 * @property {string} customerName - Name of the customer who made the booking
 * @property {string[]} services - Array of service names included in the booking
 * @property {string} slotStartTime - Start time of the booking slot (ISO 8601 format)
 * @property {string} slotEndTime - End time of the booking slot (ISO 8601 format)
 * @property {string} status - Status of the booking (e.g., "booked", "cancelled")
 * @property {string} [serviceOrderId] - ID of the associated service order, if any
 */

/**
 * @typedef {Object} BookingRequest
 * @property {string} vehicleId - ID of the vehicle to book (MongoDB ObjectId)
 * @property {string[]} serviceIds - Array of service IDs (each must be valid MongoDB ObjectId)
 * @property {Timeslot} timeSlot - The booking time slot
 */

export {};
