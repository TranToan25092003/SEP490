/**
 * @typedef {object} ServiceInfo
 * @property {string} sid - Identifier of the service.
 * @property {string} name - Display name of the service.
 * @property {number} basePrice - Base price for the service.
 */

/**
 * @typedef {object} ServiceOrder
 * @property {string} id - Service order identifier.
 * @property {string} customerName - Name of the customer.
 * @property {string} licensePlate - Vehicle license plate.
 * @property {string} vehicleModel - Model of the vehicle.
 * @property {ServiceInfo[]} services - Services attached to the service order.
 * @property {string} comment - Service order comments.
 * @property {string} appointmentTime - Appointment timestamp.
 * @property {string} status - Service order status (e.g., "pending", "confirmed", "completed", "cancelled").
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"form"> & {
 *   serviceOrder: ServiceOrder;
 *   onUpdateServiceOrder: (updatedServiceOrder: ServiceOrder) => Promise<any>;
 *   onConfirmServiceOrder: (toBeConfirmed: ServiceOrder) => Promise<any>;
 *   onSendInvoice: (serviceOrderData: ServiceOrder) => Promise<any>;
 *   getTotalPrice: (services: ServiceInfo[]) => { price: number, tax: number, total: number };
 * }} ServiceOrderEditFormProps
 */

export { default as ServiceOrderEditForm } from "./ServiceOrderForm";
export { default as ServiceOrderComment } from "./ServiceOrderComment";
export { default as ServiceOrderServices } from "./ServiceOrderServices";
export { default as ServiceOrderTotal } from "./ServiceOrderTotal";
export { default as ServiceOrderHeader } from "./ServiceOrderHeader";
export { ServiceOrderProvider, useServiceOrder } from "./ServiceOrderContext";
