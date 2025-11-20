/**
 * @typedef {object} ServiceOrderAddRequest
 * @property {string} customerName
 * @property {string} phone
 * @property {string} licensePlate
 * @property {string[]} serviceIds
 * @property {string} note
 * @property {string} address
 */

/**
 * @typedef {object} ServiceInfo
 * @property {string} id
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
