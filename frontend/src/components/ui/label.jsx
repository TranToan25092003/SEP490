import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const labelVariants = cva("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", {
  variants: {
    variant: {
      normal: "",
      heading: "text-xl font-semibold",
    },
  },
  defaultVariants: {
    variant: "normal",
  },
})

function Label({
  className,
  variant,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        labelVariants({ variant }),
        className
      )}
      {...props} />
  );
}

export { Label}
