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
 *       oneOf:
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
 */

module.exports = {};
