"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

const StarRating = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (index: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!readonly && onRatingChange && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRatingChange(index + 1);
    }
  };

  return (
    <div className={cn("flex gap-0.5", className)} role="group" aria-label="Rating">
      {Array.from({ length: maxRating }, (_, index) => {
        const isFilled = index < rating;
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={readonly}
            className={cn(
              "transition-colors",
              readonly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 rounded"
            )}
            aria-label={`${index + 1} star${index === 0 ? "" : "s"}`}
            tabIndex={readonly ? -1 : 0}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-zinc-300 dark:text-zinc-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export { StarRating };
