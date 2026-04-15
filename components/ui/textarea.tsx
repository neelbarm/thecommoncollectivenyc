import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-input/90 bg-card/40 px-3 py-2.5 text-base shadow-[inset_0_1px_0_oklch(1_0_0_/0.35)] transition-[border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none placeholder:text-muted-foreground/80 hover:border-stone/50 focus-visible:border-ring focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:bg-input/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm leading-relaxed dark:bg-input/25 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
