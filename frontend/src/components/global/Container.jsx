import { cn } from "@/lib/utils";
import React from "react";

const Container = ({ className, children }) => {
  return (
    <div className={cn("mx-auto max-w-6xl xl:max-w-7xl px-2", className)}>
      {children}
    </div>
  );
};

export default Container;
