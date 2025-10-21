/**
 * @typedef {object} CarInfo
 * @property {string} licensePlate - The license plate of the car.
 */

/**
 * @typedef {object} ServiceInfo
 * @property {string} sid - Unique identifier of the service.
 * @property {string} name - Display name of the service.
 * @property {string} [desc] - Optional description of the service.
 * @property {number} estimatedTime - Estimated time in minutes.
 * @property {number} [basePrice] - Optional base price for the service.
 */

/**
 * @typedef {object} TimeSlot
 * @property {number} hours - Hour of the slot (0-23).
 * @property {number} minutes - Minute of the slot (0-59).
 * @property {number} day - Day of month (1-31).
 * @property {number} month - Month (0-11).
 * @property {number} year - Full year (e.g. 2024).
 */

/**
 * @typedef {TimeSlot & {
 *   isAvailable: boolean;
 * }} AvailableTimeSlot
 */

/**
 * @typedef {object} AvailableTimeSlotInfo
 * @property {AvailableTimeSlot[]} timeSlots - All slots returned for the selected day.
 * @property {string} comment - Supplementary comment for the slots.
 */

/**
 * @typedef {object} BookingFormData
 * @property {ServiceInfo[]} services - Services chosen for the booking.
 * @property {TimeSlot} timeslot - Confirmed time slot for the booking.
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"form"> & {
 *   onSubmit: (data: BookingFormData) => Promise<any>;
 *   myCar: CarInfo;
 *   services: ServiceInfo[];
 *   fetchAvailableTimeSlots: (day: number, month: number, year: number) => Promise<AvailableTimeSlotInfo>;
 * }} BookingFormProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *   services: ServiceInfo[];
 * }} ServiceSelectionStepProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *   fetchAvailableTimeSlots: (day: number, month: number, year: number) => Promise<AvailableTimeSlotInfo>;
 * }} TimeSlotSelectionStepProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *   myCar: CarInfo;
 * }} ConfirmationStepProps
 */

export { default as BookingHeader } from "./BookingHeader";
export { default as BookingForm } from "./BookingForm";
export { default as ServiceSelectionStep } from "./ServiceSelectionStep";
export { default as TimeSlotSelectionStep } from "./TimeSlotSelectionStep";
export { default as ConfirmationStep } from "./ConfirmationStep";
