import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React from "react";

const containerVariants = cva("mx-auto px-2", {
  variants: {
    pageContext: {
      admin: "p-6 space-y-6 mx-0",
      default: "max-w-6xl xl:max-w-7xl"
    }
  },
  defaultVariants: {
    pageContext: "default"
  },
});

const Container = ({ className, children, noCentering, pageContext }) => {
  return (
    <div className={cn(containerVariants({ noCentering, pageContext }), className)}>
      {children}
    </div>
  );
};

export default Container;
