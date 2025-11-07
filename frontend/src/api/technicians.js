import { customFetch } from "@/utils/customAxios";

export const getTechniciansWithStatus = async () => {
  const response = await customFetch("/technicians", {
    method: "GET",
  });

  return response.data.data;
};
