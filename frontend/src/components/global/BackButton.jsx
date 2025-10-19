import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {Object} BackButtonProps
 * @property {string} [to] - Optional path to navigate to. If not provided, uses browser back
 * @property {string} [label="Quay lại"] - Button label text
 * @property {string} [className] - Additional CSS classes
 */

/**
 * BackButton component that navigates to previous page or specified route
 * @param {BackButtonProps} props
 * @returns {React.ReactElement}
 */
export const BackButton = ({ to, label = "Quay lại", className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer duration-200 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

BackButton.displayName = "BackButton";
export default BackButton;
