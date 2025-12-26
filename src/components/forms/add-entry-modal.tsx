"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TMDBSearch } from "@/components/forms/tmdb-search"
import { useTmdbDetails } from "@/hooks/use-tmdb-details"
import { PLATFORMS } from "@/lib/constants"
import type {
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  EntryFormData,
  ListWithRole,
} from "@/types"

interface AddEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (listId: string, data: EntryFormData) => Promise<void>
  lists: ListWithRole[]
  defaultListId?: string
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

export const AddEntryModal = ({
  open,
  onOpenChange,
  onSubmit,
  lists,
  defaultListId,
}: AddEntryModalProps) => {
  const [selectedResult, setSelectedResult] =
    useState<TMDBSearchResult | null>(null)
  const [selectedListId, setSelectedListId] = useState(defaultListId ?? "")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [platform, setPlatform] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const {
    details,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useTmdbDetails(
    selectedResult?.media_type ?? null,
    selectedResult?.id ?? null
  )

  useEffect(() => {
    if (detailsError) {
      setError("Failed to load details")
      setSelectedResult(null)
    }
  }, [detailsError])

  const handleSelect = (result: TMDBSearchResult) => {
    setSelectedResult(result)
    setError("")
  }

  const handleClear = () => {
    setSelectedResult(null)
    setSelectedListId(defaultListId ?? lists[0]?._id ?? "")
    setStartDate("")
    setEndDate("")
    setPlatform("")
    setNotes("")
    setError("")
  }

  const handleClose = () => {
    handleClear()
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResult || !details || !startDate || !selectedListId) return

    setIsSubmitting(true)
    setError("")

    try {
      const isMovie = selectedResult.media_type === "movie"
      const movieDetails = details as TMDBMovieDetails
      const tvDetails = details as TMDBTVDetails

      const formData: EntryFormData = {
        tmdbId: selectedResult.id,
        mediaType: selectedResult.media_type,
        title: isMovie ? movieDetails.title : tvDetails.name,
        originalTitle: isMovie
          ? movieDetails.original_title
          : tvDetails.original_name,
        overview: details.overview,
        posterPath: details.poster_path,
        backdropPath: details.backdrop_path,
        releaseDate: isMovie ? movieDetails.release_date : undefined,
        firstAirDate: !isMovie ? tvDetails.first_air_date : undefined,
        runtime: isMovie ? movieDetails.runtime : undefined,
        episodeRunTime: !isMovie ? tvDetails.episode_run_time : undefined,
        numberOfSeasons: !isMovie ? tvDetails.number_of_seasons : undefined,
        numberOfEpisodes: !isMovie ? tvDetails.number_of_episodes : undefined,
        genres: details.genres,
        voteAverage: details.vote_average,
        voteCount: details.vote_count,
        popularity: details.popularity,
        status: details.status,
        imdbId: isMovie ? movieDetails.imdb_id : undefined,
        originalLanguage: details.original_language,
        networks: !isMovie
          ? tvDetails.networks.map((n) => ({
              id: n.id,
              name: n.name,
              logoPath: n.logo_path,
            }))
          : undefined,
        startDate,
        endDate: endDate || undefined,
        platform: platform || undefined,
        notes: notes || undefined,
      }

      await onSubmit(selectedListId, formData)
      handleClose()
    } catch {
      setError("Failed to add entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isMovie = selectedResult?.media_type === "movie"
  const movieDetails = details as TMDBMovieDetails | null
  const tvDetails = details as TMDBTVDetails | null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
          <DialogDescription>
            Search for a movie or TV show to add to your list.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {!selectedResult ? (
          <TMDBSearch onSelect={handleSelect} />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedResult.poster_path ? (
                  <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded">
                    <Image
                      src={`${TMDB_IMAGE_BASE}${selectedResult.poster_path}`}
                      alt={selectedResult.title ?? selectedResult.name ?? ""}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800">
                    <span className="text-xs text-zinc-500">No poster</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">
                    {selectedResult.title ?? selectedResult.name}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {isMovie ? "Movie" : "TV Show"} •{" "}
                    {isMovie
                      ? movieDetails?.release_date?.substring(0, 4)
                      : tvDetails?.first_air_date?.substring(0, 4)}
                  </p>
                  {isLoadingDetails ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Loading details...
                    </p>
                  ) : details ? (
                    <>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {details.overview}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {details.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre.id}
                            className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0"
                    onClick={handleClear}
                  >
                    Choose different title
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="list" className="text-sm font-medium">
                  List *
                </label>
                <select
                  id="list"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  required
                >
                  <option value="">Select list...</option>
                  {lists.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium">
                    Start Date *
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium">
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="platform" className="text-sm font-medium">
                  Platform
                </label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="">Select platform...</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Any thoughts or notes..."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedListId ||
                  !startDate ||
                  isLoadingDetails
                }
              >
                {isSubmitting ? "Adding..." : "Add Entry"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
