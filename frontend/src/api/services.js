import { customFetch } from "@/utils/customAxios";

export const getServices = async () => {
  const response = await customFetch("/services", {
    method: "GET",
  });

  return response.data.data;
}
