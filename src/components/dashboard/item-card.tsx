"use client";

import Image from "next/image";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { WatchedItem } from "@/types";

interface ItemCardProps {
  item: WatchedItem;
  onEdit: (item: WatchedItem) => void;
  onDelete: (item: WatchedItem) => void;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

const ItemCard = ({ item, onEdit, onDelete }: ItemCardProps) => {
  const statusLabel = {
    watching: "Watching",
    completed: "Completed",
    want_to_watch: "Want to Watch",
  }[item.status];

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className="relative h-32 w-20 shrink-0 sm:h-40 sm:w-28">
          {item.posterPath ? (
            <Image
              src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, 112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <span className="text-xs text-zinc-400">No Image</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                  {item.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={item.status}>{statusLabel}</Badge>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.type === "movie" ? "Movie" : "TV Show"}
                  </span>
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  <button
                    onClick={() => onEdit(item)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </PopoverContent>
              </Popover>
            </div>
            {item.platform && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {item.platform}
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            {item.userRating !== undefined && item.userRating > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={item.userRating} size="sm" readonly />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  ({item.userRating})
                </span>
              </div>
            )}
            {item.tmdbRating !== undefined && item.tmdbRating > 0 && (
              <span
                className={cn(
                  "text-xs font-medium",
                  item.tmdbRating >= 7
                    ? "text-green-600 dark:text-green-400"
                    : item.tmdbRating >= 5
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                )}
              >
                TMDB: {item.tmdbRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export { ItemCard };
