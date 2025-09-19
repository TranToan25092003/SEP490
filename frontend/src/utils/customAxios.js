// src/utils/customAxios.js
import axios from "axios";
import { toast } from "sonner";

const customFetch = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Add request interceptor for logging
customFetch.interceptors.request.use(
  (config) => {
    // Log outgoing requests
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

customFetch.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response: ${response.status}`, {
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      console.error(`API Error Response: ${status}`, {
        url: error.config?.url,
        data: data,
      });

      if (status === 403 && data.isBanned) {
        toast.error(data.message || "Tài khoản của bạn đã bị cấm.");
      }
      // Xử lý các loại lỗi khác
      else if (status === 401) {
        toast.error(
          data.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );
        // Có thể redirect đến trang đăng nhập
      } else {
        toast.error(data.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } else if (error.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi (lỗi mạng)
      console.error("Network error:", error.request);
      toast.error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."
      );
    } else {
      // Lỗi khi thiết lập yêu cầu
      console.error("Setup error:", error);
      toast.error("Lỗi hệ thống: " + error.message);
    }
    return Promise.reject(error); // Luôn trả về Promise.reject để component gọi API có thể bắt lỗi
  }
);

export { customFetch };
