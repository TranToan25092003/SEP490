import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').VehicleDTO} VehicleDTO
 * @typedef {import('./types').VehicleWithAvailabilityDTO} VehicleWithAvailabilityDTO
 */

/**
 * Retrieves the authenticated user's vehicles.
 *
 * @async
 * @function getUserVehiclesWithAvailability
 * @returns {Promise<VehicleWithAvailabilityDTO[]>} A promise that resolves to an array of the user's vehicles with availability
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const vehicles = await getUserVehiclesWithAvailability();
 *   console.log(vehicles);
 * } catch (error) {
 *   console.error('Failed to fetch vehicles:', error);
 * }
 */
export const getUserVehiclesWithAvailability = async () => {
  const response = await customFetch("/vehicles/with-availability", {
    method: "GET",
  });

  return response.data.data;
};
