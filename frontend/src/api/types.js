/**
 * @fileoverview API type definitions converted from backend Swagger schemas
 * These types represent the data structures used across the API
 */

/**
 * @typedef {object} MediaAsset
 * @property {string} publicId - The public id of the cloudinary resource
 * @property {string} url - The url of the cloudinary resource
 * @property {"image" | "video" | "pdf" | "other"} kind - The kind of the resource
 */

/**
 * @typedef {object} Timeslot
 * @property {number} day - Day of the week (0-6, where 0 is Sunday)
 * @property {number} month - Month of the year (1-12)
 * @property {number} year - Full year (e.g., 2024)
 * @property {number} hours - Hour of the day (0-23)
 * @property {number} minutes - Minutes of the hour (0-59)
 */

/**
 * @typedef {object} TimeslotWithAvailability
 * @property {number} day - Day of the week (0-6, where 0 is Sunday)
 * @property {number} month - Month of the year (1-12)
 * @property {number} year - Full year (e.g., 2024)
 * @property {number} hours - Hour of the day (0-23)
 * @property {number} minutes - Minutes of the hour (0-59)
 * @property {boolean} isAvailable - Whether the timeslot is available
 */

/**
 * @typedef {object} ServiceDTO
 * @property {string} id - Service identifier
 * @property {string} name - Name of the service
 * @property {number} basePrice - Base price of the service
 * @property {string} description - Description of the service
 * @property {number} estimatedTimeInMinutes - Estimated time to complete the service in minutes
 */

/**
 * @typedef {object} VehicleDTO
 * @property {string} id - Vehicle identifier
 * @property {string} licensePlate - License plate number of the vehicle
 * @property {number} odoReading - Odometer reading of the vehicle
 * @property {number} year - Manufacturing year of the vehicle
 * @property {string} brand - Brand of the vehicle
 * @property {string} model - Model name of the vehicle
 */

/**
 * @typedef {object} VehicleWithAvailabilityDTO
 * @property {string} id - Vehicle identifier
 * @property {string} licensePlate - License plate number of the vehicle
 * @property {number} odoReading - Odometer reading of the vehicle
 * @property {number} year - Manufacturing year of the vehicle
 * @property {string} brand - Brand of the vehicle
 * @property {string} model - Model name of the vehicle
 * @property {boolean} isAvailable - Availability status of the vehicle
 */

/**
 * @typedef {object} BayDTO
 * @property {string} id - Bay identifier
 * @property {string} bayNumber - Bay number (e.g., "Bay 1")
 * @property {string} [description] - Bay description (optional)
 */

/**
 * @typedef {object} BookingCustomer
 * @property {string} customerClerkId - Clerk ID of the customer
 * @property {string} customerName - Name of the customer who made the booking
 */

/**
 * @typedef {object} BookingDTO
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
 * @typedef {object} BookingSummaryDTO
 * @property {string} id - Booking identifier
 * @property {string} customerName - Name of the customer who made the booking
 * @property {string[]} services - Array of service names included in the booking
 * @property {string} slotStartTime - Start time of the booking slot (ISO 8601 format)
 * @property {string} slotEndTime - End time of the booking slot (ISO 8601 format)
 * @property {string} status - Status of the booking (e.g., "booked", "cancelled")
 * @property {string} [serviceOrderId] - ID of the associated service order, if any
 */

/**
 * @typedef {object} BookingRequest
 * @property {string} vehicleId - ID of the vehicle to book (MongoDB ObjectId)
 * @property {string[]} serviceIds - Array of service IDs (each must be valid MongoDB ObjectId)
 * @property {Timeslot} timeSlot - The booking time slot
 */

/**
 * @typedef {object} ServiceOrderSummaryDTO
 * @property {string} id - Service order identifier
 * @property {string} bookingId - Associated booking identifier
 * @property {string} licensePlate - Vehicle license plate
 * @property {string} customerName - Name of the customer
 * @property {string} status - Status of the service order
 * @property {string} createdAt - Date when the service order was created (ISO 8601 format)
 * @property {string} [completedAt] - Date when the service order was completed (ISO 8601 format)
 * @property {string} [estimatedCompletedAt] - Estimated completion date (ISO 8601 format)
 */

/**
 * @typedef {object} ServiceOrderItemDTO
 * @property {string} type - Type of item: "service", "part", or "custom"
 * @property {string | undefined} serviceId - Service identifier (for service items)
 * @property {string | undefined} partId - Part identifier (for part items)
 * @property {string | undefined} partName - Name of the part (for part items)
 * @property {string | undefined} name - Name or description of the item
 * @property {number} price - Price per unit
 * @property {number} quantity - Quantity of the item
 */

/**
 * @typedef {object} ServiceOrderDetailDTO
 * @property {string} id - Service order identifier
 * @property {string} customerName - Name of the customer
 * @property {string} customerClerkId - Clerk ID of the customer
 * @property {string} licensePlate - Vehicle license plate with model info
 * @property {string} vehicleId - Vehicle identifier
 * @property {ServiceOrderItemDTO[]} items - Array of service order items
 * @property {string} status - Status of the service order
 * @property {string} createdAt - Date when the service order was created (ISO 8601 format)
 * @property {string} [completedAt] - Date when the service order was completed (ISO 8601 format)
 * @property {string} [estimatedCompletedAt] - Estimated completion date (ISO 8601 format)
 */

/**
 * @typedef {object} TechnicianInfo
 * @property {string} technicianClerkId - Clerk ID of the technician
 * @property {"lead" | "assistant"} role - Role of the technician in the task
 */

/**
 * @typedef {object} TechnicianInfoWithAvailabilityDTO
 * @property {string} technicianClerkId - Clerk ID of the technician
 * @property {string} technicianName - Name of the technician
 * @property {boolean} isBusy - Whether the technician is currently assigned to a task
 * @property {string | null} assignedTaskId - ID of the assigned task, or null if none
 */

/**
 * @typedef {object} CompleteInspectionPayload
 * @property {string} comment - Comment or notes about the inspection
 * @property {MediaAsset[]} media - Cloudinary media
 */

/**
 * @typedef {object} ServiceTimelineEntry
 * @property {string} title - Title of the timeline entry
 * @property {string} comment - Comment or notes for the timeline entry
 * @property {MediaAsset[]} media - Cloudinary media
 */

/**
 * @typedef {object} ServiceTimelineEntryDTO
 * @property {string} id - Timeline entry identifier
 * @property {string} title - Title of the timeline entry
 * @property {string} comment - Comment or notes for the timeline entry
 * @property {MediaAsset[]} media - Cloudinary media
 * @property {string} timestamp - Timestamp of when the entry was created (ISO 8601 format)
 */

/**
 * @typedef {object} ServiceOrderItemPayload
 * @property {string} type - Type of item: "service", "part", or "custom"
 * @property {string | undefined} serviceId - Service identifier (for service items)
 * @property {string | undefined} partId - Part identifier (for part items)
 * @property {string | undefined} name - Name or description of the item
 * @property {number} price - Price per unit
 * @property {number} quantity - Quantity of the item
 */

/**
 * @typedef {object} QuoteItemDTO
 * @property {"part" | "service"} type - Type of item: "part" or "service"
 * @property {string} name - Name or description of the item
 * @property {number} quantity - Quantity of the item
 * @property {number} price - Price per unit
 */

/**
 * @typedef {object} QuoteDTO
 * @property {string} id - Quote identifier
 * @property {string} serviceOrderId - Associated service order identifier
 * @property {QuoteItemDTO[]} items - Array of quote items (parts and services)
 * @property {number} subtotal - Total amount before tax
 * @property {number} tax - Tax amount
 * @property {number} grandTotal - Grand total (subtotal + tax)
 * @property {"pending" | "approved" | "rejected"} status - Status of the quote
 * @property {string} [rejectedReason] - Reason for rejection (if status is "rejected")
 * @property {string} createdAt - Date when the quote was created (ISO 8601 format)
 * @property {string} updatedAt - Date when the quote was last updated (ISO 8601 format)
 */

/**
 * @typedef {object} QuoteSummaryDTO
 * @property {string} id - Quote identifier
 * @property {string} serviceOrderId - Associated service order identifier
 * @property {number} grandTotal - Grand total amount
 * @property {"pending" | "approved" | "rejected"} status - Status of the quote
 * @property {string} createdAt - Date when the quote was created (ISO 8601 format)
 */

/**
 * @typedef {object} PaginationInfo
 * @property {number} currentPage - Current page number (1-indexed)
 * @property {number} totalPages - Total number of pages
 * @property {number} totalItems - Total number of items
 * @property {number} itemsPerPage - Number of items per page
 */

/**
 * @typedef {object} QuotesListResponse
 * @property {QuoteSummaryDTO[]} quotes - List of quote summaries
 * @property {PaginationInfo} pagination - Pagination information
 */

export {};
