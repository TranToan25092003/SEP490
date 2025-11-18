import { customFetch } from "@/utils/customAxios";

export const getPublicComplaintCategories = async () => {
  const response = await customFetch("/complaint-categories", {
    method: "GET",
  });
  return response.data.data || [];
};

export const getStaffComplaintCategories = async ({
  includeInactive = true,
} = {}) => {
  const response = await customFetch("/staff/complaint-categories", {
    method: "GET",
    params: {
      includeInactive,
    },
  });
  return response.data.data || [];
};

export const createComplaintCategory = async (payload) => {
  const response = await customFetch.post("/staff/complaint-categories", payload);
  return response.data.data;
};

export const updateComplaintCategory = async (id, payload) => {
  const response = await customFetch.put(
    `/staff/complaint-categories/${id}`,
    payload
  );
  return response.data.data;
};

export const deleteComplaintCategory = async (id) => {
  const response = await customFetch.delete(`/staff/complaint-categories/${id}`);
  return response.data;
};

