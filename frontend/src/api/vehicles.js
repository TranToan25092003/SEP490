import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {Object} Vehicle
 * @property {string} id - Unique identifier for the vehicle
 * @property {string} licensePlate - License plate number
 * @property {string} brand - Vehicle brand/manufacturer
 * @property {string} model - Vehicle model name
 * @property {number} year - Manufacturing year
 * @property {number} [odoReading] - Current odometer reading
 * @property {boolean} [isAvailable] - Availability status of the vehicle
 */

/**
 * Retrieves the authenticated user's vehicles.
 *
 * @async
 * @function getUserVehicles
 * @returns {Promise<Vehicle[]>} A promise that resolves to the user's vehicles
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const vehicles = await getUserVehicles();
 *   console.log(vehicles);
 * } catch (error) {
 *   console.error('Failed to fetch vehicles:', error);
 * }
 */
export const getUserVehicles = async () => {
  const response = await customFetch("/client/vehicles/summary", {
    method: "GET",
  });

  return response.data.data;
};
