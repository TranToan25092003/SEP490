import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').ServiceOrderSummaryDTO} ServiceOrderSummaryDTO
 * @typedef {import('./types').ServiceOrderDetailDTO} ServiceOrderDetailDTO
 * @typedef {import('./types').ServiceOrderItemPayload} ServiceOrderItemPayload
 */

/**
 * Get all service orders
 *
 * @async
 * @function getAllServiceOrders
 * @returns {Promise<ServiceOrderSummaryDTO[]>} A promise that resolves to an array of service order summaries
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const serviceOrders = await getAllServiceOrders();
 *   console.log(serviceOrders);
 * } catch (error) {
 *   console.error('Failed to fetch service orders:', error);
 * }
 */
export const getAllServiceOrders = async () => {
  const response = await customFetch("/service-orders", {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Get service order by ID
 *
 * @async
 * @function getServiceOrderById
 * @param {string} serviceOrderId - The ID of the service order to retrieve
 * @returns {Promise<ServiceOrderDetailDTO>} A promise that resolves to the service order details
 * @throws {Error} If the API request fails or service order is not found
 *
 * @example
 * try {
 *   const serviceOrder = await getServiceOrderById('507f1f77bcf86cd799439011');
 *   console.log(serviceOrder);
 * } catch (error) {
 *   console.error('Failed to fetch service order:', error);
 * }
 */
export const getServiceOrderById = async (serviceOrderId) => {
  const response = await customFetch(`/service-orders/${serviceOrderId}`, {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Update items in a service order
 *
 * @async
 * @function updateServiceOrderItems
 * @param {string} serviceOrderId - The ID of the service order to update
 * @param {ServiceOrderItemPayload[]} items - Array of items to update
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails or service order is not found
 *
 * @example
 * try {
 *   const items = [
 *     { type: 'service', serviceId: 'service-123', price: 100, quantity: 1 },
 *     { type: 'part', partId: 'part-456', price: 50, quantity: 2 }
 *   ];
 *   await updateServiceOrderItems('order-789', items);
 *   console.log('Items updated successfully');
 * } catch (error) {
 *   console.error('Failed to update service order items:', error);
 * }
 */
export const updateServiceOrderItems = async (serviceOrderId, items) => {
  const response = await customFetch(`/service-orders/${serviceOrderId}/items`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: { items },
  });

  return response.data;
};
