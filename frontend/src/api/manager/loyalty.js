import { customFetch } from "@/utils/customAxios";

export const getManagerLoyaltyOverview = (params) =>
  customFetch.get("/manager/loyalty/overview", { params });

export const getManagerLoyaltyCatalog = () =>
  customFetch.get("/manager/loyalty/catalog");

export const getManagerLoyaltyTransactions = (params) =>
  customFetch.get("/manager/loyalty/transactions", { params });

export const listLoyaltyRules = (params) =>
  customFetch.get("/manager/loyalty/rules", { params });

export const createLoyaltyRule = (payload) =>
  customFetch.post("/manager/loyalty/rules", payload);

export const updateLoyaltyRule = (id, payload) =>
  customFetch.put(`/manager/loyalty/rules/${id}`, payload);

export const updateLoyaltyRuleStatus = (id, payload) =>
  customFetch.patch(`/manager/loyalty/rules/${id}/status`, payload);

export const deleteLoyaltyRule = (id) =>
  customFetch.delete(`/manager/loyalty/rules/${id}`);
