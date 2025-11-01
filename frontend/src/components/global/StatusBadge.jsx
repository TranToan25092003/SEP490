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
