/**
 * @typedef {object} BookingAddRequest
 * @property {string} customerName
 * @property {string} phone
 * @property {string} licensePlate
 * @property {string[]} serviceIds
 * @property {string} note
 */

/**
 * @typedef {object} ServiceInfo
 * @property {string} sid
 * @property {string} name
 * @property {number} basePrice
 * @property {string} description
 */

/**
 * @typedef {import("react").ComponentPropsWithRef<"form"> & {
 *  onSubmit: (data: BookingAddRequest) => Promise<any>,
 *  services: ServiceInfo[]
 * }} BookingAddFormProps
 */

export { default as BookingAddForm } from "./BookingAddForm";