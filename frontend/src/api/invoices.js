import { customFetch } from "@/utils/customAxios";

export const fetchStaffInvoices = async (params = {}) => {
  const response = await customFetch("/staff/invoices", {
    method: "GET",
    params,
  });

  return response.data;
};

export const fetchInvoiceDetail = async (invoiceId) => {
  const response = await customFetch(`/staff/invoices/${invoiceId}`);
  return response.data;
};

export const confirmInvoicePayment = async (invoiceId, payload = {}) => {
  const response = await customFetch(`/staff/invoices/${invoiceId}/confirm-payment`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
};
