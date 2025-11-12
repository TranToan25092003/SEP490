import { customFetch } from "@/utils/customAxios";

export const getAllServiceOrders = async ({
  page = 1,
  limit = 20,
  customerName = null,
  status = null,
  startTimestamp = null,
  endTimestamp = null,
}) => {
  const response = await customFetch("/service-orders", {
    method: "GET",
    params: {
      page,
      limit,
      customerName,
      status,
      startTimestamp,
      endTimestamp,
    },
  });

  return response.data.data;
};

export const getServiceOrderById = async (serviceOrderId) => {
  const response = await customFetch(`/service-orders/${serviceOrderId}`, {
    method: "GET",
  });

  return response.data.data;
};

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
