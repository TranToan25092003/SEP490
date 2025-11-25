import { customFetch } from "@/utils/customAxios";

export const fetchManagerDashboard = async () => {
  const response = await customFetch("/manager/dashboard", {
    method: "GET",
  });

  return response.data;
};

