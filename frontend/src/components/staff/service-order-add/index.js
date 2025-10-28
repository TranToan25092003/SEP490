/**
 * @typedef {object} ServiceOrderAddRequest
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
 *  onSubmit: (data: ServiceOrderAddRequest) => Promise<any>,
 *  services: ServiceInfo[]
 * }} ServiceOrderAddFormProps
 */

export { default as ServiceOrderAddForm } from "./ServiceOrderAddForm";
