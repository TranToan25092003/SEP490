import { customFetch } from "@/utils/customAxios";

export const getAttendanceByDate = async (date) => {
  const response = await customFetch("/manager/attendance", {
    method: "GET",
    params: date ? { date } : undefined,
  });
  return response.data.data;
};

export const saveAttendanceByDate = async (payload) => {
  const response = await customFetch("/manager/attendance", {
    method: "PUT",
    data: payload,
  });
  return response.data.data;
};

export const markShiftForAll = async ({ date, shift, value }) => {
  const response = await customFetch("/manager/attendance/shift", {
    method: "PATCH",
    data: { date, shift, value },
  });
  return response.data.data;
};

export const resetAttendanceByDate = async (date) => {
  const response = await customFetch("/manager/attendance/reset", {
    method: "PATCH",
    data: { date },
  });
  return response.data.data;
};

export const getAttendanceHistory = async ({ startDate, endDate }) => {
  const response = await customFetch("/manager/attendance/history", {
    method: "GET",
    params: {
      startDate,
      endDate,
    },
  });
  return response.data.data;
};
