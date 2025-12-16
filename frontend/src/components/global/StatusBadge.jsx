/**
 * Converts a string value to a hue value (0-360) using a hash function.
 * This ensures consistent color generation for the same status value.
 *
 * @param {string} value - The input string to convert to a hue value
 * @returns {number} A hue value between 0 and 360
 *
 * @example
 * // Returns a consistent hue for the same input
 * stringToHue("Pending") // 240
 * stringToHue("Pending") // 240 (same value)
 */
const stringToHue = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

/**
 * Generates HSL background and foreground colors for a given status.
 * Uses the stringToHue function to ensure consistent coloring.
 *
 * @param {string} status - The status string to generate colors for
 * @returns {object} An object containing background and foreground HSL color values
 * @returns {string} returns.background - The background color in HSL format
 * @returns {string} returns.foreground - The foreground (text) color in HSL format
 *
 * @example
 * const colors = getStatusColors("Active");
 * // Returns: { background: "hsl(120, 80%, 92%)", foreground: "hsl(120, 45%, 32%)" }
 */
const getStatusColors = (status) => {
  // Màu cụ thể cho các trạng thái booking
  const bookingColorMap = {
    booked: {
      background: "hsl(210, 80%, 92%)",
      foreground: "hsl(210, 60%, 30%)",
    }, // Xanh dương nhạt - Đã đặt
    checked_in: {
      background: "hsl(200, 75%, 90%)",
      foreground: "hsl(200, 55%, 30%)",
    }, // Xanh dương - Đã tiếp nhận
    in_progress: {
      background: "hsl(15, 85%, 88%)",
      foreground: "hsl(15, 65%, 30%)",
    }, // Đỏ cam - Đang thực hiện
    completed: {
      background: "hsl(140, 60%, 85%)",
      foreground: "hsl(140, 40%, 25%)",
    }, // Xanh lá đậm - Hoàn thành
    cancelled: {
      background: "hsl(0, 70%, 92%)",
      foreground: "hsl(0, 55%, 35%)",
    }, // Đỏ nhạt - Đã hủy
  };

  // Kiểm tra nếu là trạng thái booking
  if (bookingColorMap[status]) {
    return bookingColorMap[status];
  }

  // Màu cụ thể cho các trạng thái service order
  const serviceOrderColorMap = {
    created: {
      background: "hsl(200, 80%, 92%)",
      foreground: "hsl(200, 60%, 30%)",
    }, // Xanh dương nhạt - Đã tạo
    waiting_inspection: {
      background: "hsl(45, 85%, 90%)",
      foreground: "hsl(45, 70%, 35%)",
    }, // Vàng cam - Chờ kiểm tra
    inspection_completed: {
      background: "hsl(180, 70%, 90%)",
      foreground: "hsl(180, 50%, 30%)",
    }, // Xanh lá nhạt - Đã kiểm tra
    waiting_customer_approval: {
      background: "hsl(30, 80%, 92%)",
      foreground: "hsl(30, 60%, 35%)",
    }, // Cam nhạt - Chờ khách duyệt
    approved: {
      background: "hsl(120, 70%, 88%)",
      foreground: "hsl(120, 50%, 25%)",
    }, // Xanh lá - Đã duyệt
    scheduled: {
      background: "hsl(210, 75%, 90%)",
      foreground: "hsl(210, 55%, 30%)",
    }, // Xanh dương - Đã lên lịch
    rescheduled: {
      background: "hsl(280, 90%, 95%)",
      foreground: "hsl(280, 60%, 35%)",
    }, // Tím nhạt - Dời lịch
    servicing: {
      background: "hsl(15, 85%, 88%)",
      foreground: "hsl(15, 65%, 30%)",
    }, // Đỏ cam - Đang sửa chữa
    completed: {
      background: "hsl(140, 60%, 85%)",
      foreground: "hsl(140, 40%, 25%)",
    }, // Xanh lá đậm - Hoàn thành
    cancelled: {
      background: "hsl(0, 70%, 92%)",
      foreground: "hsl(0, 55%, 35%)",
    }, // Đỏ nhạt - Đã hủy
  };

  // Kiểm tra nếu là trạng thái service order
  if (serviceOrderColorMap[status]) {
    return serviceOrderColorMap[status];
  }

  // Màu đặc biệt cho trạng thái dời lịch (rescheduled) - fallback
  if (status === "rescheduled") {
    return {
      background: "hsl(280, 90%, 95%)",
      foreground: "hsl(280, 60%, 35%)",
    };
  }

  // Màu tự động cho các trạng thái khác
  const hue = stringToHue(status || "");
  return {
    background: `hsl(${hue}, 80%, 92%)`,
    foreground: `hsl(${hue}, 45%, 32%)`,
  };
};

/**
 * StatusBadge Component
 * A dynamic, reusable badge component that displays status text with auto-generated colors.
 * Colors are generated based on the status text to ensure consistency across the application.
 *
 * @typedef {object} StatusBadgeProps
 * @property {string} status - The status text to display in the badge
 * @property {string} [colorKey] - Optional key for generating colors. If not provided, uses the status value
 * @property {string} [className] - Optional additional CSS classes to apply to the badge
 */

/**
 * Renders a status badge with dynamically generated colors based on the status value.
 * The component uses a hash function to generate consistent colors for the same status.
 *
 * @component
 * @param {StatusBadgeProps} props - The component props
 * @returns {JSX.Element} The rendered status badge
 *
 * @example
 * // Basic usage with auto-generated color
 * <StatusBadge status="Sửa xe" />
 *
 * @example
 * // With custom color key
 * <StatusBadge status="Sửa xe" colorKey="repair" />
 *
 * @example
 * // With additional styling
 * <StatusBadge status="Sửa xe" className="text-lg" />
 */
const StatusBadge = ({ status, colorKey, className = "" }) => {
  const { background, foreground } = getStatusColors(colorKey ?? status ?? "");

  return (
    <p
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${className}`}
      style={{ backgroundColor: background, color: foreground }}
    >
      {status}
    </p>
  );
};

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, getStatusColors, stringToHue };
export default StatusBadge;
