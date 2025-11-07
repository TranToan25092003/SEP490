import { customFetch } from "@/utils/customAxios";

export const scheduleInspection = async (serviceOrderId, bayId, start, end) => {
  const response = await customFetch(`/service-tasks/inspection/${serviceOrderId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      bayId,
      start: start instanceof Date ? start.toISOString() : start,
      end: end instanceof Date ? end.toISOString() : end,
    },
  });

  return response.data.data;
};

export const beginInspectionTask = async (taskId, technicians) => {
  const response = await customFetch(`/service-tasks/inspection/${taskId}/begin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      technicians,
    },
  });

  return response.data.data;
};

export const completeInspection = async (taskId, payload) => {
  const response = await customFetch(`/service-tasks/inspection/${taskId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: payload,
  });

  return response.data.data;
};

export const updateInspection = async (taskId, payload) => {
  const response = await customFetch(`/service-tasks/inspection/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: payload,
  });

  return response.data.data;
}

export const scheduleService = async (serviceOrderId, bayId, start, end) => {
  const response = await customFetch(`/service-tasks/servicing/${serviceOrderId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      bayId,
      start: start instanceof Date ? start.toISOString() : start,
      end: end instanceof Date ? end.toISOString() : end,
    },
  });

  return response.data.data;
};

export const startService = async (taskId, technicians) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      technicians,
    },
  });

  return response.data.data;
};

export const completeService = async (taskId) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/complete`, {
    method: "POST",
  });

  return response.data.data;
};

export const updateServiceTaskTimeline = async (taskId, entry) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/timeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: entry,
  });

  return response.data.data;
};

export const getServiceTaskTimelineEntry = async (taskId, entryId) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/timeline/${entryId}`, {
    method: "GET",
  });

  return response.data.data;
}

export const updateServiceTaskTimelineEntry = async (taskId, entryId, entry) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/timeline/${entryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: entry,
  });

  return response.data.data;
};

export const getAllTasksForServiceOrder = async (serviceOrderId) => {
  const response = await customFetch(`/service-tasks/tasks-for-service-order/${serviceOrderId}`, {
    method: "GET",
  });

  return response.data.data;
};

export const getServiceTaskById = async (taskId) => {
  const response = await customFetch(`/service-tasks/${taskId}`, {
    method: "GET",
  });

  return response.data.data;
}
