import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EntryStatus, WatchStatus } from "@/types"

type Status = EntryStatus | WatchStatus

interface StatusBadgeProps {
  status: Status
  className?: string
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  planned: {
    label: "Planned",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  in_progress: {
    label: "Watching",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  finished: {
    label: "Finished",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status]

  return (
    <Badge className={cn(config.className, className)}>{config.label}</Badge>
  )
}
