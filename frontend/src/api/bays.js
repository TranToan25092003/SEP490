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

export const getAllBays = async () => {
  const response = await customFetch("/bays", {
    method: "GET",
  });

  return response.data.data;
};

export const getBaySlots = async (bayId, n, durationInMinutes, from, ignoredTaskIds = []) => {
  const params = { n, duration: durationInMinutes, ignoredTaskIds };
  if (from) {
    params.from = from;
  }

  const response = await customFetch(`/bays/${bayId}/slots`, {
    method: "GET",
    params,
  });

  return response.data.data;
};

export const getBayAvailabilitySnapshot = async (params = {}) => {
  const response = await customFetch("/staff/bays/availability/snapshot", {
    method: "GET",
    params,
  });

  return response.data;
};
