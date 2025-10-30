/**
 * @swagger
 * components:
 *   schemas:
 *     Timeslot:
 *       type: object
 *       required:
 *         - day
 *         - month
 *         - year
 *         - hours
 *         - minutes
 *       properties:
 *         day:
 *           type: integer
 *           description: Day of the week (0-6, where 0 is Sunday)
 *         month:
 *           type: integer
 *           description: Month of the year (1-12)
 *         year:
 *           type: integer
 *           description: Full year (e.g., 2024)
 *         hours:
 *           type: integer
 *           description: Hour of the day (0-23)
 *         minutes:
 *           type: integer
 *           description: Minutes of the hour (0-59)
 *
 *     TimeslotWithAvailability:
 *       allOf:
 *         - $ref: '#/components/schemas/Timeslot'
 *         - type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *
 *     ServiceDTO:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - basePrice
 *         - description
 *         - estimatedTimeInMinutes
 *       properties:
 *         id:
 *           type: string
 *           description: Service identifier
 *         name:
 *           type: string
 *           description: Name of the service
 *         basePrice:
 *           type: number
 *           description: Base price of the service
 *         description:
 *           type: string
 *           description: Description of the service
 *         estimatedTimeInMinutes:
 *           type: integer
 *           description: Estimated time to complete the service in minutes
 *
 *     VehicleDTO:
 *       type: object
 *       required:
 *         - id
 *         - licensePlate
 *         - odoReading
 *         - year
 *         - brand
 *         - model
 *       properties:
 *         id:
 *           type: string
 *           description: Vehicle identifier
 *         licensePlate:
 *           type: string
 *           description: License plate number of the vehicle
 *         odoReading:
 *           type: number
 *           description: Odometer reading of the vehicle
 *         year:
 *           type: integer
 *           description: Manufacturing year of the vehicle
 *         brand:
 *           type: string
 *           description: Brand of the vehicle
 *         model:
 *           type: string
 *           description: Model name of the vehicle
 *
 *     VehicleWithAvailabilityDTO:
 *       allOf:
 *         - $ref: '#/components/schemas/VehicleDTO'
 *         - type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *
 *     BookingDTO:
 *       type: object
 *       required:
 *         - id
 *         - customer
 *         - vehicle
 *         - services
 *         - slotStartTime
 *         - slotEndTime
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Booking identifier
 *         customer:
 *           type: object
 *           required:
 *             - customerClerkId
 *             - customerName
 *           properties:
 *             customerClerkId:
 *               type: string
 *               description: Clerk ID of the customer
 *             customerName:
 *               type: string
 *               description: Name of the customer who made the booking
 *         vehicle:
 *           $ref: '#/components/schemas/VehicleDTO'
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ServiceDTO'
 *           description: Array of services included in the booking
 *         slotStartTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the booking slot
 *         slotEndTime:
 *           type: string
 *           format: date-time
 *           description: End time of the booking slot
 *         status:
 *           type: string
 *           description: Status of the booking (e.g., "booked", "in_progress")
 *         serviceOrderId:
 *           type: string
 *           description: ID of the associated service order, if any
 *
 *     BookingSummaryDTO:
 *       type: object
 *       required:
 *         - id
 *         - customerName
 *         - services
 *         - slotStartTime
 *         - slotEndTime
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Booking identifier
 *         customerName:
 *           type: string
 *           description: Name of the customer who made the booking
 *         services:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of service names included in the booking
 *         slotStartTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the booking slot
 *         slotEndTime:
 *           type: string
 *           format: date-time
 *           description: End time of the booking slot
 *         status:
 *           type: string
 *           description: Status of the booking (e.g., "booked", "cancelled")
 *         serviceOrderId:
 *           type: string
 *           description: ID of the associated service order, if any
 *
 *     BookingRequest:
 *       type: object
 *       required:
 *         - vehicleId
 *         - serviceIds
 *         - timeSlot
 *       properties:
 *         vehicleId:
 *           type: string
 *           description: ID of the vehicle to book (MongoDB ObjectId)
 *         serviceIds:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           description: Array of service IDs (each must be valid MongoDB ObjectId)
 *         timeSlot:
 *           $ref: '#/components/schemas/Timeslot'
 *
 *     ServiceOrderItemDTO:
 *       type: object
 *       required:
 *         - type
 *         - price
 *         - quantity
 *       properties:
 *         type:
 *           type: string
 *           enum: [service, part]
 *           description: Type of item
 *         name:
 *           type: string
 *           description: Name or description of the item
 *         serviceId:
 *           type: string
 *           description: Service identifier (for service items)
 *         partId:
 *           type: string
 *           description: Part identifier (for part items)
 *         partName:
 *           type: string
 *           description: Name of the part (for part items)
 *         price:
 *           type: number
 *           description: Price per unit
 *         quantity:
 *           type: integer
 *           description: Quantity of the item
 *
 *     ServiceOrderDetailDTO:
 *       type: object
 *       required:
 *         - id
 *         - customerName
 *         - customerClerkId
 *         - licensePlate
 *         - vehicleId
 *         - items
 *         - status
 *         - createdAt
 *         - comment
 *       properties:
 *         id:
 *           type: string
 *           description: Service order identifier
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         customerClerkId:
 *           type: string
 *           description: Clerk ID of the customer
 *         licensePlate:
 *           type: string
 *           description: Vehicle license plate with model info
 *         vehicleId:
 *           type: string
 *           description: Vehicle identifier
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ServiceOrderItemDTO'
 *           description: Array of service order items
 *         status:
 *           type: string
 *           description: Status of the service order
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the service order was created
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the service order was completed
 *         estimatedCompletedAt:
 *           type: string
 *           format: date-time
 *           description: Estimated completion date
 *         comment:
 *           type: string
 *           description: Additional comments or notes
 *
 *     ServiceOrderSummaryDTO:
 *       type: object
 *       required:
 *         - id
 *         - bookingId
 *         - licensePlate
 *         - customerName
 *         - status
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: Service order identifier
 *         bookingId:
 *           type: string
 *           description: Associated booking identifier
 *         licensePlate:
 *           type: string
 *           description: Vehicle license plate
 *         customerName:
 *           type: string
 *           description: Name of the customer
 *         status:
 *           type: string
 *           description: Status of the service order
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the service order was created
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the service order was completed
 *         estimatedCompletedAt:
 *           type: string
 *           format: date-time
 *           description: Estimated completion date
 *
 *     TechnicianInfo:
 *       type: object
 *       required:
 *         - technicianClerkId
 *         - role
 *       properties:
 *         technicianClerkId:
 *           type: string
 *           description: Clerk ID of the technician
 *         role:
 *           type: string
 *           enum: [lead, assistant]
 *           description: Role of the technician in the task
 *
 *     TechnicianInfoWithAvailabilityDTO:
 *       type: object
 *       required:
 *         - technicianClerkId
 *         - technicianName
 *         - isBusy
 *         - assignedTaskId
 *       properties:
 *         technicianClerkId:
 *           type: string
 *           description: Clerk ID of the technician
 *         technicianName:
 *           type: string
 *           description: Name of the technician
 *         isBusy:
 *           type: boolean
 *           description: Whether the technician is currently assigned to a task
 *         assignedTaskId:
 *           type: string
 *           nullable: true
 *           description: ID of the assigned task, or null if none
 *
 *     CompleteInspectionPayload:
 *       type: object
 *       required:
 *         - comment
 *         - photoUrls
 *       properties:
 *         comment:
 *           type: string
 *           description: Comment or notes about the inspection
 *         photoUrls:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of photos taken during the inspection
 *
 *     ServiceTimelineEntry:
 *       type: object
 *       required:
 *         - title
 *         - comment
 *         - photoUrls
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the timeline entry
 *         comment:
 *           type: string
 *           description: Comment or notes for the timeline entry
 *         photoUrls:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of photos for the timeline entry
 *
 *     ServiceOrderItemPayload:
 *       type: object
 *       required:
 *         - type
 *         - price
 *         - quantity
 *       properties:
 *         type:
 *           type: string
 *           enum: [service, part, custom]
 *           description: Type of item
 *         name:
 *           type: string
 *           description: Name or description of the item
 *         serviceId:
 *           type: string
 *           description: Service identifier (for service items)
 *         partId:
 *           type: string
 *           description: Part identifier (for part items)
 *         price:
 *           type: number
 *           description: Price per unit
 *         quantity:
 *           type: integer
 *           description: Quantity of the item
 */

module.exports = {};
