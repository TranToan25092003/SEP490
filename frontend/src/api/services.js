import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {Object} Service
 * @property {string} id - The unique identifier for the service
 * @property {string} name - The name of the service
 * @property {number} basePrice - The base price of the service
 * @property {string} description - A description of the service
 * @property {number} estimatedTimeInMinutes - The estimated time to complete the service in minutes
 */

/**
 * Retrieves a list of all available services
 *
 * @async
 * @function getServices
 * @returns {Promise<Service[]>} A promise that resolves to an array of service objects
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const services = await getServices();
 *   console.log(services);
 * } catch (error) {
 *   console.error('Failed to fetch services:', error);
 * }
 */
export const getServices = async () => {
  const response = await customFetch("/client/services", {
    method: "GET",
  });

  return response.data.data;
}
