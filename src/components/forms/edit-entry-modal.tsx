"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RatingInput, RATING_CONFIG } from "@/components/ui/rating-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { PLATFORMS } from "@/lib/constants"
import type { Entry, TMDBSearchResult, UserRatingValue, Watch } from "@/types"
import { format } from "date-fns"
import { Film, Pencil, Plus, RefreshCw, Star, Trash2, Tv } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { WatchForm } from "./watch-form"
import { TMDBSearch } from "./tmdb-search"
import type { WatchFormValues } from "@/lib/schemas"
import type { WatchFormData } from "@/types"
import { entryApi, tmdbApi } from "@/lib/api/fetchers"

interface EditEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Entry | null
  listId: string
  onAddWatch: (entryId: string, data: WatchFormData) => Promise<boolean>
  onUpdateWatch: (
    entryId: string,
    watchId: string,
    data: WatchFormData
  ) => Promise<boolean>
  onDeleteWatch: (entryId: string, watchId: string) => Promise<boolean>
  onDeleteEntry: (entryId: string) => Promise<boolean>
  onUpdateEntryPlatform: (
    entryId: string,
    platform: string
  ) => Promise<boolean>
  onUpdateRating: (
    entryId: string,
    rating: UserRatingValue | null
  ) => Promise<boolean>
  onMediaUpdated: () => void
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

const convertFormValuesToWatchData = (
  values: WatchFormValues,
  isMovie: boolean
): WatchFormData => {
  const finalEndDate =
    values.status === "finished" && isMovie && !values.endDate
      ? values.startDate
      : values.endDate

  return {
    status: values.status,
    startDate: values.startDate ? format(values.startDate, "yyyy-MM-dd") : undefined,
    endDate: finalEndDate ? format(finalEndDate, "yyyy-MM-dd") : undefined,
    platform: values.platform || undefined,
    notes: values.notes || undefined,
  }
}

export const EditEntryModal = ({
  open,
  onOpenChange,
  entry,
  listId,
  onAddWatch,
  onUpdateWatch,
  onDeleteWatch,
  onDeleteEntry,
  onUpdateEntryPlatform,
  onUpdateRating,
  onMediaUpdated,
}: EditEntryModalProps) => {
  const [showAddWatch, setShowAddWatch] = useState(false)
  const [isAddingWatch, setIsAddingWatch] = useState(false)
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null)
  const [isUpdatingWatch, setIsUpdatingWatch] = useState(false)
  const [deletingWatchId, setDeletingWatchId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [entryPlatform, setEntryPlatform] = useState(entry?.platform ?? "")
  const [isUpdatingPlatform, setIsUpdatingPlatform] = useState(false)
  const [isUpdatingRating, setIsUpdatingRating] = useState(false)
  const [showChangeTitle, setShowChangeTitle] = useState(false)
  const [isUpdatingMedia, setIsUpdatingMedia] = useState(false)

  const addWatchButtonRef = useRef<HTMLButtonElement>(null)

  const isMovie = entry?.mediaType === "movie"

  const handleClose = () => {
    setShowAddWatch(false)
    setEditingWatch(null)
    setShowChangeTitle(false)
    setError("")
    onOpenChange(false)
  }

  const handleSelectNewMedia = async (result: TMDBSearchResult) => {
    if (!entry) return

    setIsUpdatingMedia(true)
    setError("")

    try {
      const details = await tmdbApi.getDetails(result.media_type, result.id)

      const mediaData = {
        tmdbId: result.id,
        mediaType: result.media_type,
        title:
          result.media_type === "movie"
            ? (details as { title: string }).title
            : (details as { name: string }).name,
        originalTitle:
          result.media_type === "movie"
            ? (details as { original_title: string }).original_title
            : (details as { original_name: string }).original_name,
        overview: details.overview,
        posterPath: details.poster_path,
        backdropPath: details.backdrop_path,
        genres: details.genres,
        voteAverage: details.vote_average,
        voteCount: details.vote_count,
        popularity: details.popularity,
        status: details.status,
        originalLanguage: details.original_language,
        ...(result.media_type === "movie"
          ? {
              releaseDate: (details as { release_date: string }).release_date,
              runtime: (details as { runtime: number | null }).runtime,
              imdbId: (details as { imdb_id: string | null }).imdb_id,
            }
          : {
              firstAirDate: (details as { first_air_date: string }).first_air_date,
              episodeRunTime: (details as { episode_run_time: number[] }).episode_run_time,
              numberOfSeasons: (details as { number_of_seasons: number }).number_of_seasons,
              numberOfEpisodes: (details as { number_of_episodes: number }).number_of_episodes,
              networks: (
                details as {
                  networks: { id: number; name: string; logo_path: string | null }[]
                }
              ).networks?.map((n) => ({
                id: n.id,
                name: n.name,
                logoPath: n.logo_path,
              })),
            }),
      }

      await entryApi.updateMedia(listId, entry._id, mediaData)
      setShowChangeTitle(false)
      onMediaUpdated()
    } catch {
      setError("Failed to update title")
    }

    setIsUpdatingMedia(false)
  }

  const handleAddWatch = async (values: WatchFormValues) => {
    if (!entry) return

    setIsAddingWatch(true)
    setError("")

    const watchData = convertFormValuesToWatchData(values, isMovie)
    const success = await onAddWatch(entry._id, watchData)

    if (success) {
      setShowAddWatch(false)
    } else {
      setError("Failed to add watch")
    }

    setIsAddingWatch(false)
  }

  const handleEditWatch = (watch: Watch) => {
    setShowAddWatch(false)
    setEditingWatch(watch)
  }

  const handleUpdateWatch = async (values: WatchFormValues) => {
    if (!entry || !editingWatch) return

    setIsUpdatingWatch(true)
    setError("")

    const watchData = convertFormValuesToWatchData(values, isMovie)
    const success = await onUpdateWatch(entry._id, editingWatch._id, watchData)

    if (success) {
      setEditingWatch(null)
    } else {
      setError("Failed to update watch")
    }

    setIsUpdatingWatch(false)
  }

  const handleDeleteWatch = async (watchId: string) => {
    if (!entry) return

    setDeletingWatchId(watchId)
    setError("")

    const success = await onDeleteWatch(entry._id, watchId)
    if (!success) {
      setError("Failed to delete watch")
    }

    setDeletingWatchId(null)
  }

  const handleUpdateEntryPlatform = async (platform: string) => {
    if (!entry) return

    setIsUpdatingPlatform(true)
    setError("")
    setEntryPlatform(platform)

    const success = await onUpdateEntryPlatform(entry._id, platform)
    if (!success) {
      setError("Failed to update platform")
      setEntryPlatform(entry.platform ?? "")
    }

    setIsUpdatingPlatform(false)
  }

  const handleUpdateRating = async (rating: UserRatingValue | null) => {
    if (!entry) return

    setIsUpdatingRating(true)
    setError("")

    const success = await onUpdateRating(entry._id, rating)
    if (!success) {
      setError("Failed to update rating")
    }

    setIsUpdatingRating(false)
  }

  const handleDeleteEntry = async () => {
    if (!entry) return
    if (!confirm("Are you sure you want to delete this entry?")) return

    setIsDeleting(true)
    setError("")

    const success = await onDeleteEntry(entry._id)
    if (success) {
      handleClose()
    } else {
      setError("Failed to delete entry")
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!entry) return null

  const rating = Math.round(entry.voteAverage * 10) / 10

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] lg:max-w-4xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          addWatchButtonRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>Manage watch history</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex gap-4">
            {entry.posterPath ? (
              <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded">
                <Image
                  src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
                  alt={entry.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="flex h-32 w-20 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800">
                {entry.mediaType === "movie" ? (
                  <Film className="h-8 w-8 text-zinc-400" strokeWidth={1} />
                ) : (
                  <Tv className="h-8 w-8 text-zinc-400" strokeWidth={1} />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold line-clamp-2">{entry.title}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChangeTitle(!showChangeTitle)}
                  disabled={isUpdatingMedia}
                  className="shrink-0"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Change
                </Button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <Badge variant="outline" className="text-xs">
                  {entry.mediaType === "movie" ? "Movie" : "TV"}
                </Badge>
                {rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {rating}
                  </span>
                )}
              </div>
              {showChangeTitle && (
                <div className="mt-3">
                  <p className="text-sm text-zinc-500 mb-2">
                    Search for the correct title:
                  </p>
                  <TMDBSearch onSelect={handleSelectNewMedia} />
                </div>
              )}
              {!showChangeTitle && (
                <>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {entry.overview}
                  </p>
                  {!!entry.genres.length && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.genres.map((genre) => (
                        <Badge
                          key={genre.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {entry.watches.length === 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select
                value={entryPlatform}
                onValueChange={handleUpdateEntryPlatform}
                disabled={isUpdatingPlatform}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where to watch..." />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-zinc-500">
                Where you plan to watch this{" "}
                {entry.mediaType === "movie" ? "movie" : "show"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex items-center gap-3">
              <RatingInput
                value={entry.userRating}
                onChange={handleUpdateRating}
                disabled={isUpdatingRating}
              />
              {entry.userRating && (
                <span className="text-sm text-zinc-500">
                  {RATING_CONFIG[entry.userRating].label}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Watch History</label>
              <Button
                ref={addWatchButtonRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWatch(null)
                  setShowAddWatch(!showAddWatch)
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Watch
              </Button>
            </div>

            {showAddWatch && (
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <WatchForm
                  isMovie={isMovie}
                  defaultValues={{
                    status: "finished",
                    platform:
                      entry.watches.length === 0 && entry.platform
                        ? entry.platform
                        : undefined,
                  }}
                  onSubmit={handleAddWatch}
                  onCancel={() => setShowAddWatch(false)}
                  isSubmitting={isAddingWatch}
                  submitLabel="Add"
                  submittingLabel="Adding..."
                />
              </div>
            )}

            {entry.watches.length === 0 ? (
              <p className="text-sm text-zinc-500">No watch history yet</p>
            ) : (
              <div className="space-y-2">
                {entry.watches.map((watch) =>
                  editingWatch?._id === watch._id ? (
                    <div
                      key={watch._id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <WatchForm
                        isMovie={isMovie}
                        defaultValues={{
                          status: watch.status,
                          startDate: watch.startDate
                            ? new Date(watch.startDate)
                            : undefined,
                          endDate: watch.endDate
                            ? new Date(watch.endDate)
                            : undefined,
                          platform: watch.platform ?? undefined,
                          notes: watch.notes ?? undefined,
                        }}
                        onSubmit={handleUpdateWatch}
                        onCancel={() => setEditingWatch(null)}
                        isSubmitting={isUpdatingWatch}
                        submitLabel="Save"
                        submittingLabel="Saving..."
                      />
                    </div>
                  ) : (
                    <div
                      key={watch._id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <StatusBadge status={watch.status} />
                        {watch.startDate && (
                          <span>
                            {formatDate(watch.startDate)}
                            {watch.endDate &&
                              watch.endDate !== watch.startDate && (
                                <> → {formatDate(watch.endDate)}</>
                              )}
                          </span>
                        )}
                        {!watch.startDate && !watch.endDate && (
                          <span className="text-zinc-500">No date</span>
                        )}
                        {watch.platform && (
                          <span className="ml-2 text-zinc-500">
                            {watch.platform}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEditWatch(watch)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteWatch(watch._id)}
                          disabled={deletingWatchId === watch._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteEntry}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Entry"}
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
