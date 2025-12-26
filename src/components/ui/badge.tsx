import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "watching" | "completed" | "want_to_watch";
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100":
            variant === "default",
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
            variant === "watching",
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
            variant === "completed",
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200":
            variant === "want_to_watch",
        },
        className
      )}
      {...props}
    />
  );
};

export { Badge };
