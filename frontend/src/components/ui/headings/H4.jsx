import { cn } from "@/lib/utils";

export function H4({ children, className, ...props }) {
  return (
    <h4 className={cn("text-xl font-semibold", className)} {...props}>
      {children}
    </h4>
  );
}
