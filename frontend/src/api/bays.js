import { customFetch } from "@/utils/customAxios";

export const fetchBays = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await customFetch(`/staff/bays?${query}`);
  return res.data;
};

export const createBay = async (payload) => {
  const res = await customFetch(`/staff/bays`, {
    method: "POST",
    data: payload,
  });
  return res.data;
};

export const updateBay = async (id, payload) => {
  const res = await customFetch(`/staff/bays/${id}`, {
    method: "PUT",
    data: payload,
  });
  return res.data;
};

export const deleteBay = async (id) => {
  const res = await customFetch(`/staff/bays/${id}`, { method: "DELETE" });
  return res.data;
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
