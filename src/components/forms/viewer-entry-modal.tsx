"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RatingInput, RATING_CONFIG } from "@/components/ui/rating-input"
import type { ViewerEntry } from "@/types"
import { Copy, Film, Star, Tv } from "lucide-react"
import Image from "next/image"

interface ViewerEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: ViewerEntry
  onCopyToList: () => void
  hasEditableLists: boolean
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w300"

export const ViewerEntryModal = ({
  open,
  onOpenChange,
  entry,
  onCopyToList,
  hasEditableLists,
}: ViewerEntryModalProps) => {
  const rating = Math.round(entry.voteAverage * 10) / 10
  const releaseYear = entry.releaseDate?.substring(0, 4) ||
    entry.firstAirDate?.substring(0, 4)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{entry.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 aspect-2/3 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
            {entry.posterPath ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
                alt={entry.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 192px"
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
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">{entry.title}</h2>
            {entry.originalTitle !== entry.title && (
              <p className="text-sm text-zinc-500">{entry.originalTitle}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {entry.mediaType === "movie" ? "Movie" : "TV Show"}
              </Badge>
              {releaseYear && (
                <span className="text-sm text-zinc-500">{releaseYear}</span>
              )}
              {entry.voteAverage > 0 && (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {rating}/10
                </span>
              )}
            </div>

            {entry.ownerRating && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-zinc-500">Owner&apos;s rating:</span>
                <RatingInput value={entry.ownerRating} size="sm" readonly />
                <span className="text-sm text-zinc-500">
                  ({RATING_CONFIG[entry.ownerRating].label})
                </span>
              </div>
            )}

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {entry.overview || "No description available."}
            </p>

            {!!entry.genres?.length && (
              <div className="mt-4 flex flex-wrap gap-1">
                {entry.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary" className="text-xs">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-1 text-sm text-zinc-500">
              {entry.mediaType === "movie" && entry.runtime && (
                <p>Runtime: {entry.runtime} min</p>
              )}
              {entry.mediaType === "tv" && (
                <>
                  {entry.numberOfSeasons && (
                    <p>Seasons: {entry.numberOfSeasons}</p>
                  )}
                  {entry.numberOfEpisodes && (
                    <p>Episodes: {entry.numberOfEpisodes}</p>
                  )}
                </>
              )}
              <p className="text-zinc-400">List: {entry.listName}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasEditableLists && (
            <Button onClick={onCopyToList}>
              <Copy className="mr-2 h-4 w-4" />
              Copy to My List
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
