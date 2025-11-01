import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').QuoteDTO} QuoteDTO
 * @typedef {import('./types').QuoteSummaryDTO} QuoteSummaryDTO
 * @typedef {import('./types').QuotesListResponse} QuotesListResponse
 * @typedef {import('./types').PaginationInfo} PaginationInfo
 */

/**
 * Get all quotes with pagination
 *
 * @async
 * @function getAllQuotes
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Number of items per page
 * @param {string} [serviceOrderId] - Optional service order ID to filter by
 * @returns {Promise<QuotesListResponse>} A promise that resolves to the list of quotes with pagination info
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await getAllQuotes(1, 10);
 *   console.log(result.quotes);
 *   console.log(result.pagination);
 * } catch (error) {
 *   console.error('Failed to fetch quotes:', error);
 * }
 */
export const getAllQuotes = async (page = 1, limit = 10, serviceOrderId = null) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (serviceOrderId) {
    params.append("serviceOrderId", serviceOrderId);
  }

  const response = await customFetch(`/quotes?${params.toString()}`, {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Get quote by ID
 *
 * @async
 * @function getQuoteById
 * @param {string} quoteId - The ID of the quote to retrieve
 * @returns {Promise<QuoteDTO>} A promise that resolves to the quote details
 * @throws {Error} If the API request fails or quote is not found
 *
 * @example
 * try {
 *   const quote = await getQuoteById('507f1f77bcf86cd799439011');
 *   console.log(quote);
 * } catch (error) {
 *   console.error('Failed to fetch quote:', error);
 * }
 */
export const getQuoteById = async (quoteId) => {
  const response = await customFetch(`/quotes/${quoteId}`, {
    method: "GET",
  });

  return response.data.data;
};

/**
 * Get quotes for a service order with pagination
 *
 * @async
 * @function getQuotesForServiceOrder
 * @param {string} serviceOrderId - The ID of the service order
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Number of items per page
 * @returns {Promise<QuotesListResponse>} A promise that resolves to the list of quotes for the service order
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await getQuotesForServiceOrder('507f1f77bcf86cd799439011', 1, 10);
 *   console.log(result.quotes);
 * } catch (error) {
 *   console.error('Failed to fetch quotes:', error);
 * }
 */
export const getQuotesForServiceOrder = async (serviceOrderId, page = 1, limit = 10) => {
  return getAllQuotes(page, limit, serviceOrderId);
};

/**
 * Create a quote from a service order
 *
 * @async
 * @function createQuote
 * @param {string} serviceOrderId - The ID of the service order to create a quote from
 * @returns {Promise<QuoteDTO>} A promise that resolves to the created quote
 * @throws {Error} If the API request fails or service order is not found
 *
 * @example
 * try {
 *   const quote = await createQuote('507f1f77bcf86cd799439011');
 *   console.log('Quote created:', quote);
 * } catch (error) {
 *   console.error('Failed to create quote:', error);
 * }
 */
export const createQuote = async (serviceOrderId) => {
  const response = await customFetch(`/quotes/service-order/${serviceOrderId}`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Approve a quote
 *
 * @async
 * @function approveQuote
 * @param {string} quoteId - The ID of the quote to approve
 * @returns {Promise<QuoteDTO>} A promise that resolves to the approved quote
 * @throws {Error} If the API request fails or quote is not found
 *
 * @example
 * try {
 *   const quote = await approveQuote('507f1f77bcf86cd799439011');
 *   console.log('Quote approved:', quote);
 * } catch (error) {
 *   console.error('Failed to approve quote:', error);
 * }
 */
export const approveQuote = async (quoteId) => {
  const response = await customFetch(`/quotes/${quoteId}/approve`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Reject a quote with a reason
 *
 * @async
 * @function rejectQuote
 * @param {string} quoteId - The ID of the quote to reject
 * @param {string} reason - The reason for rejection
 * @returns {Promise<QuoteDTO>} A promise that resolves to the rejected quote
 * @throws {Error} If the API request fails or quote is not found
 *
 * @example
 * try {
 *   const quote = await rejectQuote('507f1f77bcf86cd799439011', 'Giá quá cao');
 *   console.log('Quote rejected:', quote);
 * } catch (error) {
 *   console.error('Failed to reject quote:', error);
 * }
 */
export const rejectQuote = async (quoteId, reason) => {
  const response = await customFetch(`/quotes/${quoteId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: { reason },
  });

  return response.data.data;
};
