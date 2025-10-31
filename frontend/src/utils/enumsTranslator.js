const bookingStatusMap = {
  booked: "Đã đặt",
  cancelled: "Đã hủy",
  "in_progress": "Đang thực hiện",
  completed: "Hoàn thành",
};

const serviceOrderStatusMap = {
  created: "Đã tạo",
  waiting_inspection: "Chờ kiểm tra",
  inspection_completed: "Đã kiểm tra",
  waiting_customer_approval: "Chờ khách duyệt",
  approved: "Đã duyệt",
  scheduled: "Đã lên lịch",
  servicing: "Đang sửa chữa",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusBadgeVariant = {
  pending: "secondary",
  approved: "success",
  rejected: "destructive",
};

const statusText = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

export function translateQuoteStatus(status) {
  return statusText[status] || "Không xác định";
}

export function getQuoteStatusBadgeVariant(status) {
  return statusBadgeVariant[status] || "default";
}

export function translateBookingStatus(status) {
  return bookingStatusMap[status] || "Không xác định";
}

export function translateServiceOrderStatus(status) {
  return serviceOrderStatusMap[status] || "Không xác định";
}
