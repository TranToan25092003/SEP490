import { cn } from "@/lib/utils";

export function H5({ children, className, ...props }) {
  return (
    <h5 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h5>
  );
}
