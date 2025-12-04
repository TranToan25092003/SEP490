import { customFetch } from "@/utils/customAxios";

// Get transaction list from Sepay (via backend proxy)
export const getSepayTransactions = async (limit = 1) => {
  try {
    const response = await customFetch("/invoices/sepay/transactions", {
      method: "GET",
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Sepay transactions:", error);
    throw error;
  }
};

// Get transaction details from Sepay (via backend proxy)
export const getSepayTransactionDetail = async (transactionId) => {
  try {
    const response = await customFetch("/invoices/sepay/transactions/detail", {
      method: "GET",
      params: { transaction_id: transactionId },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Sepay transaction detail:", error);
    throw error;
  }
};

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
  const response = await customFetch(
    `/staff/invoices/${invoiceId}/confirm-payment`,
    {
    method: "PATCH",
    data: payload,
    }
  );

  return response.data;
};

export const fetchCustomerInvoices = async () => {
  const response = await customFetch("/invoices", {
    method: "GET",
  });

  return response.data;
};

export const fetchCustomerInvoiceDetail = async (invoiceId) => {
  const response = await customFetch(`/invoices/${invoiceId}`, {
    method: "GET",
  });

  return response.data;
};
