import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900":
            variant === "default",
          "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100":
            variant === "secondary",
          "border border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
