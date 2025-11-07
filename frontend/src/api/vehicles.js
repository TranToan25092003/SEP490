import { customFetch } from "@/utils/customAxios";

export const getUserVehiclesWithAvailability = async () => {
  const response = await customFetch("/vehicles/with-availability", {
    method: "GET",
  });

  return response.data.data;
};
