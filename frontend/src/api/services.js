import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').ServiceDTO} ServiceDTO
 */

/**
 * Retrieves a list of all available services
 *
 * @async
 * @function getServices
 * @returns {Promise<ServiceDTO[]>} A promise that resolves to an array of service objects
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
  const response = await customFetch("/services", {
    method: "GET",
  });

  return response.data.data;
}
