import { customFetch } from "@/utils/customAxios";

/**
 * Get a list of all bays
 *
 * @async
 * @function fetchBays
 * @param {Object} params - Query parameters for pagination and filtering
 * @returns {Promise<Array>} A promise that resolves to an array of bays
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const bays = await fetchBays({ page: 1, limit: 10 });
 *   console.log(bays);
 * } catch (error) {
 *   console.error('Failed to fetch bays:', error);
 * }
 */
export const fetchBays = async (params) => {
  const query = new URLSearchParams(params).toString();
  const response = await customFetch(`/staff/bays?${query}`);
  return response.data.data;
};

/**
 * Create a new bay
 *
 * @async
 * @function createBay
 * @param {Object} newBay - The data for the new bay
 * @returns {Promise<Object>} A promise that resolves to the created bay
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const bay = await createBay({ bay_number: "Bay 1", status: "available" });
 *   console.log('Created bay:', bay);
 * } catch (error) {
 *   console.error('Failed to create bay:', error);
 * }
 */
export const createBay = async (newBay) => {
  const response = await customFetch(`/staff/bays`, {
    method: "POST",
    body: JSON.stringify(newBay),
    headers: { "Content-Type": "application/json" },
  });
  return response.data.data;
};

/**
 * Update an existing bay
 *
 * @async
 * @function updateBay
 * @param {string} id - The ID of the bay to update
 * @param {Object} updatedBay - The updated data for the bay
 * @returns {Promise<Object>} A promise that resolves to the updated bay
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const bay = await updateBay('bay-123', { status: "occupied" });
 *   console.log('Updated bay:', bay);
 * } catch (error) {
 *   console.error('Failed to update bay:', error);
 * }
 */
export const updateBay = async (id, updatedBay) => {
  const response = await customFetch(`/staff/bays/${id}`, {
    method: "PUT",
    body: JSON.stringify(updatedBay),
    headers: { "Content-Type": "application/json" },
  });
  return response.data.data;
};

/**
 * Delete a bay
 *
 * @async
 * @function deleteBay
 * @param {string} id - The ID of the bay to delete
 * @returns {Promise<void>} A promise that resolves when the bay is deleted
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   await deleteBay('bay-123');
 *   console.log('Deleted bay successfully');
 * } catch (error) {
 *   console.error('Failed to delete bay:', error);
 * }
 */
export const deleteBay = async (id) => {
  const response = await customFetch(`/staff/bays/${id}`, { method: "DELETE" });
  return response.data.data;
};

/**
 * @typedef {import('./types').BayDTO} BayDTO
 */

/**
 * Get all bays
 *
 * @async
 * @function getAllBays
 * @returns {Promise<BayDTO[]>} A promise that resolves to an array of all bays
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const bays = await getAllBays();
 *   console.log(bays);
 * } catch (error) {
 *   console.error('Failed to fetch bays:', error);
 * }
 */
export const getAllBays = async () => {
  const response = await customFetch("/bays", {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Get N available slots for a specific bay
 *
 * @async
 * @function getBaySlots
 * @param {string} bayId - The ID of the bay
 * @param {number} n - The number of available slots to retrieve
 * @param {number} durationInMinutes - The expected duration of the task in minutes
 * @returns {Promise<Array<{start: string, end: string}>>} A promise that resolves to available slots
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const slots = await getBaySlots('bay-123', 5, 60);
 *   console.log(slots);
 * } catch (error) {
 *   console.error('Failed to fetch bay slots:', error);
 * }
 */
export const getBaySlots = async (bayId, n, durationInMinutes) => {
  const response = await customFetch(`/bays/${bayId}/slots`, {
    method: "GET",
    params: { n, duration: durationInMinutes },
  });

  return response.data.data;
};
