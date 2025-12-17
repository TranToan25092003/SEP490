import { customFetch } from "@/utils/customAxios";

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

export const getQuoteById = async (quoteId) => {
  const response = await customFetch(`/quotes/${quoteId}`, {
    method: "GET",
  });

  return response.data.data;
};

export const getQuotesForServiceOrder = async (serviceOrderId, page = 1, limit = 10) => {
  return getAllQuotes(page, limit, serviceOrderId);
};

export const createQuote = async (serviceOrderId, options = {}) => {
  const response = await customFetch(`/quotes/service-order/${serviceOrderId}`, {
    method: "POST",
    skipAutoToast: options.skipAutoToast || false,
  });

  return response.data.data;
};

export const approveQuote = async (quoteId) => {
  const response = await customFetch(`/quotes/${quoteId}/approve`, {
    method: "POST",
  });

  return response.data.data;
};

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
