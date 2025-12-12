import { customFetch } from "@/utils/customAxios";

export const getPointBalance = () => customFetch.get("/loyalty/balance");
export const getPointHistory = (params) =>
  customFetch.get("/loyalty/history", { params });
export const redeemPoints = (payload) =>
  customFetch.post("/loyalty/redeem", payload);
export const redeemVoucher = (payload) =>
  customFetch.post("/loyalty/redeem/voucher", payload);
export const dailyCheckIn = () => customFetch.post("/loyalty/checkin");
