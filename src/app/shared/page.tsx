"use client"

import { AddEntryModal } from "@/components/forms/add-entry-modal"
import { ViewerEntryModal } from "@/components/forms/viewer-entry-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/ui/header"
import { Input } from "@/components/ui/input"
import { RatingInput } from "@/components/ui/rating-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLists } from "@/hooks/use-lists"
import { useSharedEntries } from "@/hooks/use-shared-entries"
import { entryApi } from "@/lib/api/fetchers"
import { USER_RATING_FILTER_OPTIONS } from "@/lib/constants"
import { useSession } from "@/lib/auth-client"
import type {
  EntryFormData,
  TMDBSearchResult,
  UserRatingValue,
  ViewerEntry,
  ViewerFilterState,
  ViewerSortField,
  ViewerSortState,
} from "@/types"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronUp,
  Film,
  LayoutGrid,
  LayoutList,
  List,
  RotateCcw,
  Star,
  Table,
  Tv,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

const DEFAULT_FILTERS: ViewerFilterState = {
  search: "",
  listId: "all",
  mediaType: "all",
  genre: "all",
  ownerRating: "all",
}

const DEFAULT_SORT: ViewerSortState = {
  field: "createdAt",
  direction: "desc",
}

const VIEWER_SORT_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "listName", label: "List" },
  { value: "voteAverage", label: "TMDB Rating" },
  { value: "ownerRating", label: "Owner Rating" },
  { value: "createdAt", label: "Date Added" },
] as const

const SharedPage = () => {
  const { data: session } = useSession()
  const { entries, isLoading: isEntriesLoading, refetch } = useSharedEntries()
  const { lists, isLoading: isListsLoading } = useLists()

  const viewerLists = useMemo(
    () => lists.filter((list) => list.role === "viewer"),
    [lists]
  )

  const editableLists = useMemo(
    () => lists.filter((list) => list.role !== "viewer"),
    [lists]
  )

  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [preSelectedResult, setPreSelectedResult] =
    useState<TMDBSearchResult | null>(null)
  const [viewMode, setViewMode] = useLocalStorage<"gallery" | "list" | "table">(
    "shared-view-mode",
    "gallery"
  )

  const viewingEntry = useMemo(
    () => entries.find((e) => e._id === viewingEntryId) ?? null,
    [entries, viewingEntryId]
  )

  const [filters, setFilters] = useLocalStorage<ViewerFilterState>(
    "shared-filters",
    DEFAULT_FILTERS
  )

  const [sort, setSort] = useLocalStorage<ViewerSortState>(
    "shared-sort",
    DEFAULT_SORT
  )

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSort(DEFAULT_SORT)
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.listId !== "all" ||
    filters.mediaType !== "all" ||
    filters.genre !== "all" ||
    filters.ownerRating !== "all" ||
    sort.field !== "createdAt" ||
    sort.direction !== "desc"

  const allGenres = useMemo(() => {
    const genreSet = new Set<string>()
    entries.forEach((entry) => {
      entry.genres?.forEach((g) => genreSet.add(g.name))
    })
    return Array.from(genreSet).sort()
  }, [entries])

  const stats = useMemo(() => {
    const totalMovies = entries.filter((e) => e.mediaType === "movie").length
    const totalTvShows = entries.filter((e) => e.mediaType === "tv").length

    return {
      totalMovies,
      totalTvShows,
    }
  }, [entries])

  const filteredAndSortedEntries = useMemo(() => {
    const userRatingOrder: Record<UserRatingValue, number> = {
      disliked: 1,
      liked: 2,
      loved: 3,
    }

    const filtered = entries.filter((entry) => {
      if (
        filters.search &&
        !entry.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }
      if (filters.listId !== "all" && entry.listId !== filters.listId) {
        return false
      }
      if (
        filters.mediaType !== "all" &&
        entry.mediaType !== filters.mediaType
      ) {
        return false
      }
      if (
        filters.genre !== "all" &&
        !entry.genres?.some((g) => g.name === filters.genre)
      ) {
        return false
      }
      if (filters.ownerRating !== "all") {
        if (filters.ownerRating === "none") {
          if (entry.ownerRating) return false
        } else {
          if (entry.ownerRating !== filters.ownerRating) return false
        }
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1

      switch (sort.field) {
        case "title":
          return dir * a.title.localeCompare(b.title)

        case "listName":
          return dir * a.listName.localeCompare(b.listName)

        case "voteAverage":
          return dir * (a.voteAverage - b.voteAverage)

        case "ownerRating": {
          const ratingA = a.ownerRating ? userRatingOrder[a.ownerRating] : 0
          const ratingB = b.ownerRating ? userRatingOrder[b.ownerRating] : 0
          return dir * (ratingA - ratingB)
        }

        case "createdAt":
          return dir * a.createdAt.localeCompare(b.createdAt)

        default:
          return 0
      }
    })

    return sorted
  }, [entries, filters, sort])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleTableSort = (field: ViewerSortField) => {
    if (sort.field === field) {
      setSort((s) => ({
        ...s,
        direction: s.direction === "asc" ? "desc" : "asc",
      }))
    } else {
      setSort({ field, direction: "desc" })
    }
  }

  const renderSortIcon = (field: ViewerSortField) => {
    if (sort.field !== field) return null
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  const handleCopyToList = (entry: ViewerEntry) => {
    const tmdbResult: TMDBSearchResult = {
      id: entry.tmdbId,
      media_type: entry.mediaType,
      title: entry.mediaType === "movie" ? entry.title : undefined,
      name: entry.mediaType === "tv" ? entry.title : undefined,
      overview: entry.overview,
      poster_path: entry.posterPath,
      backdrop_path: entry.backdropPath,
      vote_average: entry.voteAverage,
      vote_count: entry.voteCount,
      popularity: entry.popularity,
      release_date: entry.releaseDate,
      first_air_date: entry.firstAirDate,
      genre_ids: entry.genres.map((g) => g.id),
      original_language: entry.originalLanguage,
      original_title:
        entry.mediaType === "movie" ? entry.originalTitle : undefined,
      original_name: entry.mediaType === "tv" ? entry.originalTitle : undefined,
    }
    setPreSelectedResult(tmdbResult)
    setViewingEntryId(null)
    setIsAddEntryOpen(true)
  }

  const handleAddEntry = async (listId: string, data: EntryFormData) => {
    await entryApi.create(listId, data)
    refetch()
  }

  if (!session) {
    return null
  }

  const isLoading = isEntriesLoading || isListsLoading
  const hasMultipleLists = viewerLists.length > 1

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header>
        <Link href="/">
          <Button variant="outline" size="sm">
            My Entries
          </Button>
        </Link>
        <Link href="/lists">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" />
            My Lists
          </Button>
        </Link>
      </Header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Shared With Me</h1>
          <p className="text-sm text-zinc-500">
            Entries from lists where you&apos;re a viewer
          </p>
        </div>

        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 max-w-md">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mediaType === "movie"
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                : ""
            }`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                mediaType: f.mediaType === "movie" ? "all" : "movie",
              }))
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Film className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMovies}</p>
                <p className="text-sm text-zinc-500">Movies</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mediaType === "tv"
                ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950"
                : ""
            }`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                mediaType: f.mediaType === "tv" ? "all" : "tv",
              }))
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Tv className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTvShows}</p>
                <p className="text-sm text-zinc-500">TV Shows</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="flex-1 sm:max-w-xs"
          />
          {hasMultipleLists && (
            <Select
              value={filters.listId}
              onValueChange={(value) =>
                setFilters((f) => ({ ...f, listId: value }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Lists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lists</SelectItem>
                {viewerLists.map((list) => (
                  <SelectItem key={list._id} value={list._id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.genre}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, genre: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {allGenres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.ownerRating}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                ownerRating: value as UserRatingValue | "none" | "all",
              }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Owner Rating" />
            </SelectTrigger>
            <SelectContent>
              {USER_RATING_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ms-auto">
            <Select
              value={sort.field}
              onValueChange={(value) =>
                setSort((s) => ({ ...s, field: value as ViewerSortField }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEWER_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSort((s) => ({
                  ...s,
                  direction: s.direction === "asc" ? "desc" : "asc",
                }))
              }
              title={sort.direction === "asc" ? "Ascending" : "Descending"}
            >
              {sort.direction === "asc" ? (
                <ArrowUpAZ className="h-4 w-4" />
              ) : (
                <ArrowDownAZ className="h-4 w-4" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetFilters}
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "gallery" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("gallery")}
              title="Gallery view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : filteredAndSortedEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            {entries.length === 0 ? (
              <>
                <h3 className="mb-2 text-lg font-medium">
                  No shared entries yet
                </h3>
                <p className="text-sm text-zinc-500">
                  Join a list as a viewer to see entries shared with you.
                </p>
              </>
            ) : (
              <>
                <h3 className="mb-2 text-lg font-medium">No matches</h3>
                <p className="text-sm text-zinc-500">
                  Try adjusting your filters.
                </p>
              </>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-sm text-nowrap">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("title")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Title {renderSortIcon("title")}
                    </span>
                  </th>
                  {hasMultipleLists && (
                    <th
                      className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                      onClick={() => handleTableSort("listName")}
                    >
                      <span className="inline-flex items-center gap-1">
                        List {renderSortIcon("listName")}
                      </span>
                    </th>
                  )}
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Genres</th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("createdAt")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Added {renderSortIcon("createdAt")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("ownerRating")}
                  >
                    <span className="inline-flex items-center gap-1 text-nowrap">
                      Owner Rating {renderSortIcon("ownerRating")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("voteAverage")}
                  >
                    <span className="inline-flex items-center gap-1">
                      TMDB {renderSortIcon("voteAverage")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredAndSortedEntries.map((entry) => (
                  <tr
                    key={entry._id}
                    onClick={() => setViewingEntryId(entry._id)}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {entry.posterPath ? (
                          <div className="relative h-6 w-4 shrink-0 overflow-hidden rounded-sm">
                            <Image
                              src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="16px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-6 w-4 shrink-0 items-center justify-center rounded-sm bg-zinc-200 dark:bg-zinc-800">
                            {entry.mediaType === "movie" ? (
                              <Film className="h-3 w-3 text-zinc-400" />
                            ) : (
                              <Tv className="h-3 w-3 text-zinc-400" />
                            )}
                          </div>
                        )}
                        <span
                          className="truncate max-w-[200px]"
                          title={entry.title}
                        >
                          {entry.title}
                        </span>
                      </div>
                    </td>
                    {hasMultipleLists && (
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                        <span
                          className="truncate max-w-[120px] block"
                          title={entry.listName}
                        >
                          {entry.listName}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.mediaType === "movie" ? "Movie" : "TV"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      <span className="truncate max-w-[150px] block">
                        {entry.genres?.map((g) => g.name).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      {entry.ownerRating ? (
                        <RatingInput
                          value={entry.ownerRating}
                          size="sm"
                          readonly
                        />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {entry.voteAverage > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Math.round(entry.voteAverage * 10) / 10}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === "gallery" ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAndSortedEntries.map((entry) => {
              const rating = Math.round(entry.voteAverage * 10) / 10
              const genres = entry.genres?.map((g) => g.name).join(", ") || ""
              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setViewingEntryId(entry._id)}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 cursor-pointer"
                >
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
                          <Film
                            className="h-16 w-16 text-zinc-400"
                            strokeWidth={1}
                          />
                        ) : (
                          <Tv
                            className="h-16 w-16 text-zinc-400"
                            strokeWidth={1}
                          />
                        )}
                      </div>
                    )}

                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-white">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {rating}
                      </span>
                    </div>

                    {entry.ownerRating && (
                      <div className="absolute left-3 bottom-3">
                        <RatingInput
                          value={entry.ownerRating}
                          size="sm"
                          readonly
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="text-lg font-semibold line-clamp-2"
                      title={entry.title}
                    >
                      {entry.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.mediaType === "movie" ? "Movie" : "TV"}
                      </Badge>
                      {hasMultipleLists && (
                        <span
                          className="text-sm text-zinc-500 truncate"
                          title={entry.listName}
                        >
                          {entry.listName}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {genres && (
                        <p className="line-clamp-1 text-ellipsis">{genres}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedEntries.map((entry) => {
              const rating = Math.round(entry.voteAverage * 10) / 10

              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setViewingEntryId(entry._id)}
                  className="flex w-full gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 cursor-pointer"
                >
                  {entry.posterPath ? (
                    <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded">
                      <Image
                        src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
                        alt={entry.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800">
                      <Film className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{entry.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {entry.mediaType === "movie" ? "Movie" : "TV Show"}
                          </Badge>
                          {hasMultipleLists && (
                            <span className="text-sm text-zinc-500">
                              {entry.listName}
                            </span>
                          )}
                          {entry.ownerRating && (
                            <RatingInput
                              value={entry.ownerRating}
                              size="sm"
                              readonly
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {entry.overview}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                      {entry.voteAverage > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          TMDB: {rating}/10
                        </span>
                      )}
                      {entry.mediaType === "movie" && entry.runtime && (
                        <span>{entry.runtime} min</span>
                      )}
                      {entry.mediaType === "tv" && entry.numberOfSeasons && (
                        <span>{entry.numberOfSeasons} seasons</span>
                      )}
                    </div>
                    {!!entry.genres?.length && (
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
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {viewingEntry && (
        <ViewerEntryModal
          open={!!viewingEntry}
          onOpenChange={(open) => !open && setViewingEntryId(null)}
          entry={viewingEntry}
          onCopyToList={() => handleCopyToList(viewingEntry)}
          hasEditableLists={editableLists.length > 0}
        />
      )}

      <AddEntryModal
        open={isAddEntryOpen}
        onOpenChange={(open) => {
          setIsAddEntryOpen(open)
          if (!open) setPreSelectedResult(null)
        }}
        onSubmit={handleAddEntry}
        lists={editableLists}
        defaultListId={editableLists[0]?._id}
        preSelectedResult={preSelectedResult}
      />
    </div>
  )
}

export default SharedPage
