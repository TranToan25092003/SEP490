import { customFetch } from "@/utils/customAxios";

export const getAllBays = async () => {
  const response = await customFetch("/bays", {
    method: "GET",
  });

  return response.data.data;
};

export const getBaySlots = async (bayId, n, durationInMinutes) => {
  const response = await customFetch(`/bays/${bayId}/slots`, {
    method: "GET",
    params: { n, duration: durationInMinutes },
  });

  return response.data.data;
};
