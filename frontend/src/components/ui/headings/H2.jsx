import { cn } from "@/lib/utils";

export function H2({ children, className, ...props }) {
  return (
    <h2 className={cn("text-3xl font-bold", className)} {...props}>
      {children}
    </h2>
  );
}
