"use client"

import { TMDBSearch } from "@/components/forms/tmdb-search"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import { Textarea } from "@/components/ui/textarea"
import { useTmdbDetails } from "@/hooks/use-tmdb-details"
import { ENTRY_STATUS_OPTIONS, PLATFORMS } from "@/lib/constants"
import { addEntryFormSchema, type AddEntryFormValues } from "@/lib/schemas"
import type {
  EntryFormData,
  EntryStatus,
  ListWithRole,
  TMDBMovieDetails,
  TMDBSearchResult,
  TMDBTVDetails,
  UserRatingValue,
} from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Badge } from "../ui/badge"

interface AddEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (listId: string, data: EntryFormData) => Promise<void>
  lists: ListWithRole[]
  defaultListId?: string
  preSelectedResult?: TMDBSearchResult | null
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

export const AddEntryModal = ({
  open,
  onOpenChange,
  onSubmit,
  lists,
  defaultListId,
  preSelectedResult,
}: AddEntryModalProps) => {
  const editableLists = useMemo(
    () => lists.filter((list) => list.role !== "viewer"),
    [lists]
  )

  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddEntryFormValues>({
    resolver: zodResolver(addEntryFormSchema),
    defaultValues: {
      listId: defaultListId ?? "",
      watchStatus: "planned",
      platform: "",
      notes: "",
      rating: null,
    },
    mode: "onChange",
  })

  const watchStatus = useWatch({ control, name: "watchStatus" })
  const startDate = useWatch({ control, name: "startDate" })
  const endDate = useWatch({ control, name: "endDate" })
  const rating = useWatch({ control, name: "rating" })

  const {
    details,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useTmdbDetails(
    selectedResult?.media_type ?? null,
    selectedResult?.id ?? null
  )

  const handleSelect = (result: TMDBSearchResult) => {
    setSelectedResult(result)
    setError("")
  }

  const handleClear = useCallback(() => {
    setSelectedResult(null)
    reset({
      listId: defaultListId ?? editableLists[0]?._id ?? "",
      watchStatus: "planned",
      startDate: undefined,
      endDate: undefined,
      platform: "",
      notes: "",
      rating: null,
    })
    setError("")
  }, [defaultListId, editableLists, reset])

  const handleClose = () => {
    onOpenChange(false)
  }

  const isFormValid = () => {
    if (!selectedResult || !details) return false
    return true
  }

  const onFormSubmit = async (formValues: AddEntryFormValues) => {
    if (!selectedResult || !details) return

    setIsSubmitting(true)
    setError("")

    try {
      const isMovie = selectedResult.media_type === "movie"
      const movieDetails = details as TMDBMovieDetails
      const tvDetails = details as TMDBTVDetails

      const baseData = {
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
        platform: formValues.platform || undefined,
        notes: formValues.notes || undefined,
        rating: formValues.rating || undefined,
      }

      let formData: EntryFormData
      if (formValues.watchStatus === "planned") {
        formData = { ...baseData, watchStatus: "planned" }
      } else if (formValues.watchStatus === "in_progress") {
        formData = {
          ...baseData,
          watchStatus: "in_progress",
          startDate: format(formValues.startDate!, "yyyy-MM-dd"),
        }
      } else {
        const finalEndDate =
          selectedResult.media_type === "movie" && !formValues.endDate
            ? formValues.startDate!
            : formValues.endDate!
        formData = {
          ...baseData,
          watchStatus: "finished",
          startDate: format(formValues.startDate!, "yyyy-MM-dd"),
          endDate: format(finalEndDate, "yyyy-MM-dd"),
        }
      }

      await onSubmit(formValues.listId, formData)
      handleClose()
    } catch {
      setError("Failed to add entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (detailsError) {
      setError("Failed to load details")
      setSelectedResult(null)
    }
  }, [detailsError])

  useEffect(() => {
    if (open) {
      if (preSelectedResult) {
        setSelectedResult(preSelectedResult)
        reset({
          listId: defaultListId ?? editableLists[0]?._id ?? "",
          watchStatus: "planned",
          startDate: undefined,
          endDate: undefined,
          platform: "",
          notes: "",
          rating: null,
        })
        setError("")
      } else {
        handleClear()
      }
    }
  }, [open, handleClear, preSelectedResult, defaultListId, editableLists, reset])

  const isMovie = selectedResult?.media_type === "movie"
  const movieDetails = details as TMDBMovieDetails | null
  const tvDetails = details as TMDBTVDetails | null

  const dateError =
    watchStatus === "finished" && startDate && endDate && endDate < startDate
      ? "End date must be on or after start date"
      : ""

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <form onSubmit={handleSubmit(onFormSubmit)}>
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
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {details.overview}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {details.genres.map((genre) => (
                          <Badge
                            key={genre.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {genre.name}
                          </Badge>
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
                <label className="text-sm font-medium">List *</label>
                <Controller
                  name="listId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editableLists.map((list) => (
                          <SelectItem key={list._id} value={list._id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.listId && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.listId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <Controller
                  name="watchStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as EntryStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTRY_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {watchStatus !== "planned" && (
                <div className="space-y-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Start Date *
                      </label>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            placeholder="Pick start date"
                          />
                        )}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>
                    {watchStatus === "finished" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          End Date {isMovie ? "(optional)" : "*"}
                        </label>
                        <Controller
                          name="endDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              date={field.value}
                              onDateChange={field.onChange}
                              placeholder={
                                isMovie ? "Same as start date" : "Pick end date"
                              }
                            />
                          )}
                        />
                        {errors.endDate && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {errors.endDate.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {dateError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {dateError}
                    </p>
                  )}
                  {watchStatus === "finished" && isMovie && !endDate && (
                    <p className="text-sm text-zinc-500">
                      For movies, end date defaults to start date if not
                      specified.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Controller
                  name="platform"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      rows={2}
                      placeholder="Any thoughts or notes..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Rating</label>
                <div className="flex items-center gap-3">
                  <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => (
                      <RatingInput
                        value={field.value}
                        onChange={(value: UserRatingValue | null) =>
                          field.onChange(value)
                        }
                      />
                    )}
                  />
                  {rating && (
                    <span className="text-sm text-zinc-500">
                      {RATING_CONFIG[rating].label}
                    </span>
                  )}
                </div>
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
                disabled={isSubmitting || !isFormValid() || isLoadingDetails}
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
