import { customFetch } from "@/utils/customAxios";

export const getManagerLoyaltyOverview = (params) =>
  customFetch.get("/manager/loyalty/overview", { params });

export const getManagerLoyaltyCatalog = () =>
  customFetch.get("/manager/loyalty/catalog");

export const getManagerLoyaltyTransactions = (params) =>
  customFetch.get("/manager/loyalty/transactions", { params });
