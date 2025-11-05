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
 * @param {TechnicianInfo[]} technicians - Array of technicians to assign
 * @param {number} expectedDurationInMinutes - Expected duration of the inspection
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the scheduled inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await scheduleInspection(
 *     'order-123',
 *     [{ technicianClerkId: 'clerk_1', role: 'lead' }],
 *     30
 *   );
 *   console.log('Inspection scheduled:', result);
 * } catch (error) {
 *   console.error('Failed to schedule inspection:', error);
 * }
 */
export const scheduleInspection = async (serviceOrderId, technicians, expectedDurationInMinutes) => {
  const response = await customFetch(`/service-tasks/inspection/${serviceOrderId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      technicians,
      expectedDurationInMinutes,
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
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the started inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await beginInspectionTask('task-123');
 *   console.log('Inspection started:', result);
 * } catch (error) {
 *   console.error('Failed to start inspection:', error);
 * }
 */
export const beginInspectionTask = async (taskId) => {
  const response = await customFetch(`/service-tasks/inspection/${taskId}/begin`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Complete an inspection task
 *
 * @async
 * @function completeInspection
 * @param {string} taskId - The ID of the inspection task
 * @param {CompleteInspectionPayload} payload - The inspection completion data
 * @returns {Promise<{ serviceOrder: any, inspectionTask: any }>} A promise that resolves to the completed inspection details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await completeInspection('task-123', {
 *     comment: 'Inspection completed successfully',
 *     photoUrls: ['https://example.com/photo1.jpg']
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
 * @param {TechnicianInfo[]} technicians - Array of technicians to assign
 * @param {number} expectedDurationInMinutes - Expected duration of the service
 * @returns {Promise<{ serviceOrder: any, servicingTask: any }>} A promise that resolves to the scheduled service details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await scheduleService(
 *     'order-123',
 *     [{ technicianClerkId: 'clerk_1', role: 'lead' }],
 *     120
 *   );
 *   console.log('Service scheduled:', result);
 * } catch (error) {
 *   console.error('Failed to schedule service:', error);
 * }
 */
export const scheduleService = async (serviceOrderId, technicians, expectedDurationInMinutes) => {
  const response = await customFetch(`/service-tasks/servicing/${serviceOrderId}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      technicians,
      expectedDurationInMinutes,
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
 * @returns {Promise<{ serviceOrder: any, servicingTask: any }>} A promise that resolves to the started service details
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await startService('task-123');
 *   console.log('Service started:', result);
 * } catch (error) {
 *   console.error('Failed to start service:', error);
 * }
 */
export const startService = async (taskId) => {
  const response = await customFetch(`/service-tasks/servicing/${taskId}/start`, {
    method: "POST",
  });

  return response.data.data;
};

/**
 * Complete a servicing task
 *
 * @async
 * @function completeService
 * @param {string} taskId - The ID of the servicing task
 * @returns {Promise<any>} A promise that resolves to the completed service details
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
 * @param {ServiceTimelineEntry} entry - The timeline entry to add
 * @returns {Promise<any>} A promise that resolves to the updated servicing task
 * @throws {Error} If the API request fails
 *
 * @example
 * try {
 *   const result = await updateServiceTaskTimeline('task-123', {
 *     title: 'Oil Change Complete',
 *     comment: 'Changed oil and filter',
 *     photoUrls: ['https://example.com/photo.jpg']
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
