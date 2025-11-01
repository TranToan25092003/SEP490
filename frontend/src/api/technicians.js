import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').TechnicianInfoWithAvailabilityDTO} TechnicianInfoWithAvailabilityDTO
 */

/**
 * Get all technicians with their current availability status
 *
 * @async
 * @function getTechniciansWithStatus
 * @returns {Promise<TechnicianInfoWithAvailabilityDTO[]>} A promise that resolves to an array of technicians with availability
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const technicians = await getTechniciansWithStatus();
 *   console.log(technicians);
 * } catch (error) {
 *   console.error('Failed to fetch technicians:', error);
 * }
 */
export const getTechniciansWithStatus = async () => {
  const response = await customFetch("/technicians", {
    method: "GET",
  });

  return response.data.data;
};
