import { customFetch } from "@/utils/customAxios";

/**
 * @typedef {import('./types').TechnicianInfo} TechnicianInfo
 * @typedef {import('./types').CompleteInspectionPayload} CompleteInspectionPayload
 * @typedef {import('./types').ServiceTimelineEntry} ServiceTimelineEntry
 */

/**
 * Schedule an inspection for a service order
 *
 * @async
 * @function scheduleInspection
 * @param {string} serviceOrderId - The ID of the service order
 * @param {string} bayId - The ID of the bay to schedule the inspection in
 * @param {string|Date} start - Start time of the inspection (ISO 8601 date-time string or Date object)
 * @param {string|Date} end - End time of the inspection (ISO 8601 date-time string or Date object)
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the scheduled inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await scheduleInspection(
 *     'order-123',
 *     'bay-456',
 *     '2025-11-06T09:00:00Z',
 *     '2025-11-06T10:00:00Z'
 *   );
 *   console.log('Inspection scheduled:', result);
 * } catch (error) {
 *   console.error('Failed to schedule inspection:', error);
 * }
 */
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

/**
 * Begin an inspection task
 *
 * @async
 * @function beginInspectionTask
 * @param {string} taskId - The ID of the inspection task
 * @param {TechnicianInfo[]} technicians - Array of technicians to assign
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the started inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await beginInspectionTask('task-123', [
 *     { technicianClerkId: 'clerk_1', role: 'lead' },
 *     { technicianClerkId: 'clerk_2', role: 'assistant' }
 *   ]);
 *   console.log('Inspection started:', result);
 * } catch (error) {
 *   console.error('Failed to start inspection:', error);
 * }
 */
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

/**
 * Complete an inspection task
 *
 * @async
 * @function completeInspection
 * @param {string} taskId - The ID of the inspection task
 * @param {CompleteInspectionPayload} payload - The inspection completion data (comment and media array)
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the completed inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await completeInspection('task-123', {
 *     comment: 'Inspection completed successfully',
 *     media: [
 *       { url: 'https://example.com/photo1.jpg', publicId: 'abc123', kind: 'image' }
 *     ]
 *   });
 *   console.log('Inspection completed:', result);
 * } catch (error) {
 *   console.error('Failed to complete inspection:', error);
 * }
 */
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

/**
 * Schedule a servicing task for a service order
 *
 * @async
 * @function scheduleService
 * @param {string} serviceOrderId - The ID of the service order
 * @param {string} bayId - The ID of the bay to schedule the servicing in
 * @param {string|Date} start - Start time of the servicing (ISO 8601 date-time string or Date object)
 * @param {string|Date} end - End time of the servicing (ISO 8601 date-time string or Date object)
 * @returns {Promise<{ serviceOrder: any, servicingTask: any }>} A promise that resolves to the scheduled service details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await scheduleService(
 *     'order-123',
 *     'bay-456',
 *     '2025-11-06T09:00:00Z',
 *     '2025-11-06T11:00:00Z'
 *   );
 *   console.log('Service scheduled:', result);
 * } catch (error) {
 *   console.error('Failed to schedule service:', error);
 * }
 */
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

/**
 * Start a servicing task
 *
 * @async
 * @function startService
 * @param {string} taskId - The ID of the servicing task
 * @param {TechnicianInfo[]} technicians - Array of technicians to assign
 * @returns {Promise<{ serviceOrder: any, servicingTask: any }>} A promise that resolves to the started service details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await startService('task-123', [
 *     { technicianClerkId: 'clerk_1', role: 'lead' },
 *     { technicianClerkId: 'clerk_2', role: 'assistant' }
 *   ]);
 *   console.log('Service started:', result);
 * } catch (error) {
 *   console.error('Failed to start service:', error);
 * }
 */
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

/**
 * Complete a servicing task
 *
 * @async
 * @function completeService
 * @param {string} taskId - The ID of the servicing task
 * @returns {Promise<{ serviceOrder: any, servicingTask: any }>} A promise that resolves to the completed service details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await completeService('task-123');
 *   console.log('Service completed:', result);
 * } catch (error) {
 *   console.error('Failed to complete service:', error);
 * }
 */
export const completeService = async (taskId) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/complete`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Update the timeline of a servicing task
 *
 * @async
 * @function updateServiceTaskTimeline
 * @param {string} taskId - The ID of the servicing task
 * @param {ServiceTimelineEntry} entry - The timeline entry to add (title, comment, and media array)
 * @returns {Promise<any>} A promise that resolves to the updated servicing task
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await updateServiceTaskTimeline('task-123', {
 *     title: 'Oil Change Complete',
 *     comment: 'Changed oil and filter',
 *     media: [
 *       { url: 'https://example.com/photo.jpg', publicId: 'xyz789', kind: 'image' }
 *     ]
 *   });
 *   console.log('Timeline updated:', result);
 * } catch (error) {
 *   console.error('Failed to update timeline:', error);
 * }
 */
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
