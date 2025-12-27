"use client"

import { useState } from "react"
import Image from "next/image"
import { MoreVertical, Plus, Trash2, Star, Film, Tv, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Entry, ListRole, WatchStatus } from "@/types"

interface EntryCardProps {
  entry: Entry
  currentUserId: string
  listRole: ListRole
  onAddWatch: (entry: Entry) => void
  onDelete: (entryId: string) => void
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

const getStatusConfig = (status: WatchStatus | null) => {
  switch (status) {
    case "finished":
      return { label: "completed", className: "bg-green-100 text-green-800" }
    case "in_progress":
      return { label: "watching", className: "bg-yellow-100 text-yellow-800" }
    default:
      return { label: "planned", className: "bg-zinc-100 text-zinc-800" }
  }
}

export const EntryCard = ({
  entry,
  currentUserId,
  listRole,
  onAddWatch,
  onDelete,
}: EntryCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const canEdit = listRole === "owner" || entry.addedByUserId === currentUserId

  const mostRecentWatch =
    entry.watches.length > 0 ? entry.watches[entry.watches.length - 1] : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const statusConfig = getStatusConfig(mostRecentWatch?.status ?? null)
  const rating = Math.round(entry.voteAverage * 10) / 10
  const genres = entry.genres?.slice(0, 2).map((g) => g.name).join(", ") || ""

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
        {entry.posterPath ? (
          <Image
            src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
            alt={entry.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {entry.mediaType === "movie" ? (
              <Film className="h-16 w-16 text-zinc-400" strokeWidth={1} />
            ) : (
              <Tv className="h-16 w-16 text-zinc-400" strokeWidth={1} />
            )}
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-white">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {rating}
          </span>
        </div>

        {canEdit && (
          <div className="absolute bottom-2 right-2">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute bottom-full right-0 z-50 mb-1 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  <button
                    onClick={() => {
                      onAddWatch(entry)
                      setIsMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4" />
                    Log rewatch
                  </button>
                  <button
                    onClick={() => {
                      onDelete(entry._id)
                      setIsMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2" title={entry.title}>
          {entry.title}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {entry.mediaType === "movie" ? "Movie" : "TV"}
          </Badge>
          {mostRecentWatch?.platform && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {mostRecentWatch.platform}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {mostRecentWatch?.startDate && (
            <p className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(mostRecentWatch.startDate)}
            </p>
          )}
          {genres && <p>{genres}</p>}
        </div>
      </div>
    </div>
  )
}
