"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border/70 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      style={
        orientation === "horizontal"
          ? { backgroundImage: "linear-gradient(90deg, transparent, oklch(0.72 0.055 78 / 0.3), transparent)" }
          : { backgroundImage: "linear-gradient(180deg, transparent, oklch(0.72 0.055 78 / 0.3), transparent)" }
      }
      {...props}
    />
  )
}

export { Separator }
