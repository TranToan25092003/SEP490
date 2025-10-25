/**
 * @typedef {object} TechnicianInfo
 * @property {string} id - Identifier of the technician.
 * @property {string} name - Display name of the technician.
 */

/**
 * @typedef {object} BayInfo
 * @property {string} id - Identifier of the bay.
 * @property {string} name - Display name of the bay.
 * @property {boolean} isFinal - Indicates if the bay assignment is final.
 */

/**
 * @typedef {object} ServiceInfo
 * @property {string} sid - Identifier of the service.
 * @property {string} name - Display name of the service.
 * @property {number} basePrice - Base price for the service.
 */

/**
 * @typedef {object} Booking
 * @property {string} id - Booking identifier.
 * @property {string} customerName - Name of the customer.
 * @property {string} licensePlate - Vehicle license plate.
 * @property {string} vehicleModel - Model of the vehicle.
 * @property {ServiceInfo[]} services - Services attached to the booking.
 * @property {TechnicianInfo} fixTechnician - Assigned fix technician.
 * @property {BayInfo} bayInfo - Assigned bay.
 * @property {string} comment - Booking comments.
 * @property {string} appointmentTime - Appointment timestamp.
 * @property {string} status - Booking status (e.g., "pending", "confirmed", "completed", "cancelled").
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"form"> & {
 *   booking: Booking;
 *   onUpdateBooking: (updatedBooking: Booking) => Promise<any>;
 *   onConfirmBooking: (toBeConfirmed: Booking) => Promise<any>;
 *   onSendInvoice: (bookingData: Booking) => Promise<any>;
 *   getTotalPrice: (services: ServiceInfo[]) => { price: number, tax: number, total: number };
 * }} BookingEditFormProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   booking: Booking;
 *   confirmBookingLoading?: boolean;
 *   disabled?: boolean;
 * }} BookingHeaderProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   disabled?: boolean;
 * }} BookingCommentProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   disabled?: boolean;
 * }} BookingServicesProps
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<typeof import("@/components/ui/card").Card> & {
 *   subtotal?: number;
 *   taxRate?: number;
 *   updateBookingLoading?: boolean;
 *   disabled?: boolean;
 *   onUpdateServices: () => void | Promise<void>;
 * }} BookingTotalProps
 */

export { default as BookingEditForm } from "./BookingForm";
export { default as BookingComment } from "./BookingComment";
export { default as BookingServices } from "./BookingServices";
export { default as BookingTotal } from "./BookingTotal";
export { default as BookingHeader } from "./BookingHeader";
