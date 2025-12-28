"use client"

import { ThumbsDown, ThumbsUp, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRatingValue } from "@/types"

interface RatingInputProps {
  value?: UserRatingValue | null
  onChange?: (value: UserRatingValue | null) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
  className?: string
}

const RATING_CONFIG: Record<
  UserRatingValue,
  { icon: typeof ThumbsDown; label: string; activeClass: string }
> = {
  disliked: {
    icon: ThumbsDown,
    label: "Didn't enjoy",
    activeClass: "fill-red-500 text-red-500",
  },
  liked: {
    icon: ThumbsUp,
    label: "Enjoyed",
    activeClass: "fill-green-500 text-green-500",
  },
  loved: {
    icon: Heart,
    label: "Really liked",
    activeClass: "fill-pink-500 text-pink-500",
  },
}

const RATING_OPTIONS: UserRatingValue[] = ["disliked", "liked", "loved"]

const RatingInput = ({
  value,
  onChange,
  size = "md",
  readonly = false,
  className,
}: RatingInputProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleClick = (rating: UserRatingValue) => {
    if (readonly || !onChange) return
    onChange(value === rating ? null : rating)
  }

  const handleKeyDown = (e: React.KeyboardEvent, rating: UserRatingValue) => {
    if (readonly || !onChange) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onChange(value === rating ? null : rating)
    }
  }

  if (readonly) {
    if (!value) return null

    const config = RATING_CONFIG[value]
    const Icon = config.icon

    return (
      <span className={className} title={config.label}>
        <Icon className={cn(sizeClasses[size], config.activeClass)} />
      </span>
    )
  }

  return (
    <div
      className={cn("flex gap-2", className)}
      role="group"
      aria-label="Rating"
    >
      {RATING_OPTIONS.map((rating) => {
        const config = RATING_CONFIG[rating]
        const Icon = config.icon
        const isActive = value === rating

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            className="cursor-pointer transition-all rounded-md p-1.5 hover:scale-110 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1"
            aria-label={config.label}
            aria-pressed={isActive}
            tabIndex={0}
            title={config.label}
          >
            <Icon
              className={cn(
                sizeClasses[size],
                isActive
                  ? config.activeClass
                  : "fill-transparent text-zinc-400 dark:text-zinc-500"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export { RatingInput, RATING_CONFIG }
