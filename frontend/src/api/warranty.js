import { customFetch } from "@/utils/customAxios";

export const createWarrantyBooking = async (warrantyData) => {
  const response = await customFetch("/warranty/create-booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: warrantyData,
  });

  return response.data;
};

export const getUserWarranties = async () => {
  const response = await customFetch("/warranty/me", {
    method: "GET",
  });

  return response.data.data;
};

export const getWarrantyById = async (warrantyId) => {
  const response = await customFetch(`/warranty/${warrantyId}`, {
    method: "GET",
  });

  return response.data.data;
};

export const checkWarrantyEligibility = async (serviceOrderId) => {
  const response = await customFetch(`/warranty/check-eligibility/${serviceOrderId}`, {
    method: "GET",
  });

  return response.data.data;
};

