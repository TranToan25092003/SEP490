import { cn } from "@/lib/utils";

export function H1({ children, className, ...props }) {
  return (
    <h1 className={cn("text-4xl font-bold", className)} {...props}>
      {children}
    </h1>
  );
}
