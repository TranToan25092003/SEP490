import { cn } from "@/lib/utils";

export function H6({ children, className, ...props }) {
  return (
    <h6 className={cn("text-base font-semibold", className)} {...props}>
      {children}
    </h6>
  );
}
