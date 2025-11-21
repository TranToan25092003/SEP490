import { customFetch } from "@/utils/customAxios";

export const getMyComplaints = async () => {
  const response = await customFetch.get("/complaints/mine");
  return response.data.data || [];
};

export const getComplaintDetail = async (complaintId) => {
  const response = await customFetch.get(`/complaints/${complaintId}`);
  return response.data.data;
};
