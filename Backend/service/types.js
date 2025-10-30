// The DTOs will become Swagger definitions and client API models

/**
 * STAFF / TECHNICIAN SERVICE
 */

/**
 * @typedef {object} TechnicianInfo
 * @property {string} technicianClerkId - Clerk ID of the technician.
 * @property {"lead" | "assistant"} role - Role of the technician in the task.
 */

/**
 * @typedef {object} TechnicianInfoWithAvailabilityDTO
 * @property {string} technicianClerkId - Clerk ID of the technician.
 * @property {string} technicianName - Name of the technician.
 * @property {boolean} isBusy - Whether the technician is currently assigned to a task.
 * @property {string | null} assignedTaskId - ID of the assigned task, or null if none.
 */

/**
 * BOOKING SERVICE
 */

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
 * SERVICE ORDER SERVICE
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
 * @typedef {object} ServiceOrderSummaryDTO
 * @property {string} id - Service order identifier.
 * @property {string} bookingId - Associated booking identifier.
 * @property {string} licensePlate - Vehicle license plate.
 * @property {string} customerName - Name of the customer.
 * @property {string} status - Status of the service order.
 * @property {Date} createdAt - Date when the service order was created.
 * @property {Date} [completedAt] - Date when the service order was completed.
 * @property {Date} [estimatedCompletedAt] - Estimated completion date.
 */

/**
 * @typedef {object} ServiceOrderItemDTO
 * @property {string} type - Type of item: "service", "part", or "custom".
 * @property {string | undefined} name - Name or description of the item.
 * @property {string | undefined} serviceId - Service identifier (for service items).
 * @property {string | undefined} partId - Part identifier (for part items).
 * @property {string | undefined} partName - Name of the part (for part items).
 * @property {number} price - Price per unit.
 * @property {number} quantity - Quantity of the item.
 */

/**
 * @typedef {object} ServiceOrderDetailDTO
 * @property {string} id - Service order identifier.
 * @property {string} customerName - Name of the customer.
 * @property {string} customerClerkId - Clerk ID of the customer.
 * @property {string} licensePlate - Vehicle license plate with model info.
 * @property {string} vehicleId - Vehicle identifier.
 * @property {Array<ServiceOrderItemDTO>} items - Array of service order items.
 * @property {string} status - Status of the service order.
 * @property {Date} createdAt - Date when the service order was created.
 * @property {Date} [completedAt] - Date when the service order was completed.
 * @property {Date} [estimatedCompletedAt] - Estimated completion date.
 * @property {string} comment - Additional comments or notes.
 */

/**
 * SERVICE ORDER TASK SERVICE
 */

/**
 * @typedef {object} CompleteInspectionPayload
 * @property {string} comment - Comment or notes about the inspection.
 * @property {string[]} photoUrls - URLs of photos taken during the inspection.
 */

/**
 * @typedef {object} ServiceTimelineEntry
 * @property {string} title - Title of the timeline entry.
 * @property {string} comment - Comment or notes for the timeline entry.
 * @property {string[]} photoUrls - URLs of photos for the timeline entry.
 */

/**
 * VEHICLE SERVICE
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
