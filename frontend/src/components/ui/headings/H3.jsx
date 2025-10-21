import { cn } from "@/lib/utils";

export function H3({ children, className, ...props }) {
  return (
    <h3 className={cn("text-2xl font-semibold", className)} {...props}>
      {children}
    </h3>
  );
}
