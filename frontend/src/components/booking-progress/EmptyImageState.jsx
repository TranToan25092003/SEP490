import { memo } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {import("react").ComponentPropsWithRef<"div"> & {
 *  message?: string;
 *  description?: string;
 * }} EmptyImageStateProps
 */

/**
 * EmptyImageState component to display when no images are available
 * Memoized to prevent unnecessary re-renders
 * @param {EmptyImageStateProps} props
 */
const EmptyImageState = ({ 
  message = "Chưa có ảnh",
  description = "Chọn một bước để xem ảnh cập nhật hoặc bước này chưa có ảnh nào.",
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)} {...props}>
      <div className="rounded-full bg-muted p-6 mb-4">
        <ImageOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">
        {message}
      </h4>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {description}
      </p>
    </div>
  );
};

const EmptyImageStateMemo = memo(EmptyImageState);
EmptyImageStateMemo.displayName = "EmptyImageState";

export default EmptyImageStateMemo;
