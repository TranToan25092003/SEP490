import { memo } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/semdo.png";

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *  icon?: React.ComponentType<{ className?: string }>;
 *  title?: string;
 *  subtitle?: string;
 *  children?: React.ReactNode;
 *  showLogo?: boolean;
 * }} EmptyStateProps
 */

/**
 * EmptyState component to display when no content is available
 * Supports custom icons, title, subtitle, and render props for additional content
 * @param {EmptyStateProps} props
 */
const EmptyState = ({
  icon: Icon,
  title = "Không có dữ liệu",
  subtitle = "Hiện tại chưa có thông tin nào được ghi nhận.",
  children,
  showLogo = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {/* Logo or Icon */}
      <div className="mb-6">
        {Icon ? (
          <div className="rounded-full bg-muted p-6">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : showLogo ? (
          <img
            src={logo}
            alt="Logo"
            className="h-24 w-24 object-contain opacity-50"
          />
        ) : null}
      </div>

      {/* Title */}
      <h4 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h4>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {subtitle}
      </p>

      {/* Custom content via render prop */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

const EmptyStateMemo = memo(EmptyState);
EmptyStateMemo.displayName = "EmptyState";

export default EmptyStateMemo;
