/**
 * @typedef {object} ItemInfo
 * @property {string} type - Identifier of the item.
 * @property {string} name - Display name of the item.
 * @property {string | undefined} serviceId - Service identifier (for service items).
 * @property {string | undefined} partId - Part identifier (for part items).
 * @property {string | undefined} partName - Name of the part (for part items).
 * @property {number} price - Base price for the item.
 * @property {number} quantity - Quantity of the item.
 */

/**
 * @typedef {object} ServiceOrder
 * @property {string} id - Service order identifier.
 * @property {string} customerName - Name of the customer.
 * @property {string} licensePlate - Vehicle license plate.
 * @property {ItemInfo[]} items - Items attached to the service order.
 * @property {string} comment - Service order comments.
 * @property {string} status - Service order status (e.g., "pending", "confirmed", "completed", "cancelled").
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"form"> & {
 *   serviceOrder: ServiceOrder;
 *   onUpdateServiceOrder: (updatedServiceOrder: ServiceOrder, items: ItemInfo[]) => Promise<any>;
 *   onStartServiceOrder: (toBeConfirmed: ServiceOrder) => Promise<any>;
 *   onCancelServiceOrder: (toBeConfirmed: ServiceOrder) => Promise<any>;
 *   onSendInvoice: (serviceOrderData: ServiceOrder, items: ItemInfo[]) => Promise<any>;
 *   getTotalPrice: (services: ServiceInfo[]) => { price: number, tax: number, total: number };
 * }} ServiceOrderEditFormProps
 */

export { default as ServiceOrderEditForm } from "./ServiceOrderForm";
export { default as ServiceOrderServices } from "./ServiceOrderServices";
export { default as ServiceOrderTotal } from "./ServiceOrderTotal";
export { default as ServiceOrderHeader } from "./ServiceOrderHeader";
export { ServiceOrderProvider, useServiceOrder } from "./ServiceOrderContext";
export { default as InspectionTaskModal } from "./InspectionTaskModal";
export { default as ServiceTaskAddModal } from "./ServiceTaskAddModal";
export { default as ServiceTaskTimeline } from "./ServiceTaskTimeline";
export { default as ServiceTaskInspectionCard } from "./ServiceTaskInspectionCard";
export { default as ServiceTaskServicingCard } from "./ServiceTaskServicingCard";
export { default as BaySchedulingModal } from "./BaySchedulingModal";
