"use client"

import { useState } from "react"
import Image from "next/image"
import { MoreVertical, Plus, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Entry, ListRole } from "@/types"

interface EntryCardProps {
  entry: Entry
  currentUserId: string
  listRole: ListRole
  onAddWatch: (entry: Entry) => void
  onDelete: (entryId: string) => void
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342"

export const EntryCard = ({
  entry,
  currentUserId,
  listRole,
  onAddWatch,
  onDelete,
}: EntryCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const canEdit = listRole === "owner" || entry.addedByUserId === currentUserId

  const mostRecentWatch = entry.watches.reduce((latest, watch) =>
    new Date(watch.addedAt) > new Date(latest.addedAt) ? watch : latest
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      {entry.posterPath ? (
        <div className="relative aspect-2/3 w-full">
          <Image
            src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
            alt={entry.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      ) : (
        <div className="flex aspect-2/3 w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
          <span className="text-zinc-500">No poster</span>
        </div>
      )}

      {canEdit && (
        <div className="absolute right-2 top-2">
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
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
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

      <div className="p-3">
        <h3 className="font-medium line-clamp-1" title={entry.title}>
          {entry.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <Badge variant="outline" className="text-xs">
            {entry.mediaType === "movie" ? "Movie" : "TV"}
          </Badge>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {entry.watches.length}
          </div>
        </div>
        {mostRecentWatch && (
          <p className="mt-2 text-xs text-zinc-500">
            Last watched: {formatDate(mostRecentWatch.startDate)}
            {mostRecentWatch.platform && ` on ${mostRecentWatch.platform}`}
          </p>
        )}
      </div>
    </div>
  )
}
