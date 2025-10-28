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


export function translateBookingStatus(status) {
  return bookingStatusMap[status] || "Không xác định";
}

export function translateServiceOrderStatus(status) {
  return serviceOrderStatusMap[status] || "Không xác định";
}
