"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Film, Tv, Eye, List, Popcorn, LayoutGrid, LayoutList, Star, Calendar } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserMenu } from "@/components/auth/user-menu"
import { AddEntryModal } from "@/components/forms/add-entry-modal"
import { EditEntryModal } from "@/components/forms/edit-entry-modal"
import { useAllEntries, type EntryWithList } from "@/hooks/use-all-entries"
import { useLists } from "@/hooks/use-lists"
import { entryApi } from "@/lib/api/fetchers"
import { PLATFORMS, MEDIA_TYPE_OPTIONS, ENTRY_STATUS_OPTIONS } from "@/lib/constants"
import type { DashboardFilterState, MediaType, EntryFormData, EntryStatus } from "@/types"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

const getStatusConfig = (status: EntryStatus) => {
  switch (status) {
    case "finished":
      return { label: "completed", className: "bg-green-100 text-green-800" }
    case "in_progress":
      return { label: "watching", className: "bg-yellow-100 text-yellow-800" }
    case "planned":
    default:
      return { label: "planned", className: "bg-zinc-100 text-zinc-800" }
  }
}

const getStatusColor = (status: EntryStatus) => {
  switch (status) {
    case "planned":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    case "in_progress":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
    case "finished":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
  }
}

const getStatusLabel = (status: EntryStatus) => {
  const option = ENTRY_STATUS_OPTIONS.find((opt) => opt.value === status)
  return option?.label ?? status
}

const Home = () => {
  const { data: session } = useSession()
  const {
    entries,
    isLoading: isEntriesLoading,
    refetch,
    addWatch,
    updateWatch,
    deleteWatch,
    deleteEntry,
    updateEntryPlatform,
  } = useAllEntries()
  const { lists, isLoading: isListsLoading } = useLists()

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<EntryWithList | null>(null)
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery")

  const [filters, setFilters] = useState<DashboardFilterState>({
    search: "",
    listId: "all",
    mediaType: "all",
    genre: "all",
    platform: "all",
  })

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
    const totalWatches = entries.reduce((sum, e) => sum + (e.watches?.length ?? 0), 0)
    const ratings = entries
      .filter((e) => e.voteAverage > 0)
      .map((e) => e.voteAverage)
    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

    return { totalMovies, totalTvShows, totalWatches, totalEntries: entries.length, averageRating }
  }, [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.search && !entry.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.listId !== "all" && entry.listId !== filters.listId) {
        return false
      }
      if (filters.mediaType !== "all" && entry.mediaType !== filters.mediaType) {
        return false
      }
      if (filters.genre !== "all" && !entry.genres?.some((g) => g.name === filters.genre)) {
        return false
      }
      if (filters.platform !== "all") {
        const hasWatchOnPlatform = entry.watches?.some((w) => w.platform === filters.platform)
        if (!hasWatchOnPlatform) return false
      }
      return true
    })
  }, [entries, filters])

  const getMostRecentWatch = (entry: EntryWithList) => {
    if (!entry.watches?.length) return null
    return entry.watches[entry.watches.length - 1]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleAddEntry = async (listId: string, data: EntryFormData) => {
    await entryApi.create(listId, data)
    refetch()
  }

  if (!session) {
    return null
  }

  const defaultListId = lists[0]?._id

  const isLoading = isEntriesLoading || isListsLoading

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
              <Popcorn className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Watched</h1>
              <p className="text-xs text-zinc-500">
                Track movies & TV shows you&apos;re watching together
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => setIsAddEntryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
            <Link href="/lists">
              <Button variant="outline" size="sm">
                <List className="mr-2 h-4 w-4" />
                My Lists
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
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
          <Card>
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
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalWatches}</p>
                <p className="text-sm text-zinc-500">Total Watches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                <span className="flex h-5 w-5 items-center justify-center text-yellow-600 dark:text-yellow-400">
                  ★
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-sm text-zinc-500">Avg TMDB Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full sm:w-64"
          />
          <Select
            value={filters.listId}
            onValueChange={(value) => setFilters((f) => ({ ...f, listId: value }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Lists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              {lists.map((list) => (
                <SelectItem key={list._id} value={list._id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.mediaType}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, mediaType: value as MediaType | "all" }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.genre}
            onValueChange={(value) => setFilters((f) => ({ ...f, genre: value }))}
          >
            <SelectTrigger className="w-[140px]">
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
            value={filters.platform}
            onValueChange={(value) => setFilters((f) => ({ ...f, platform: value }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1">
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
          </div>
        </div>

        {isLoading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            {entries.length === 0 ? (
              <>
                <h3 className="mb-2 text-lg font-medium">No entries yet</h3>
                <p className="mb-4 text-sm text-zinc-500">
                  Create a list and start tracking your movies and TV shows.
                </p>
                <Link href="/lists">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Go to Lists
                  </Button>
                </Link>
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
        ) : viewMode === "gallery" ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredEntries.map((entry) => {
              const mostRecentWatch = getMostRecentWatch(entry)
              const statusConfig = getStatusConfig(mostRecentWatch?.status ?? "planned")
              const rating = Math.round(entry.voteAverage * 10) / 10
              const genres = entry.genres?.slice(0, 2).map((g) => g.name).join(", ") || ""
              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setEditingEntry(entry)}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
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
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => {
              const mostRecentWatch = getMostRecentWatch(entry)
              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setEditingEntry(entry)}
                  className="flex w-full gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-left transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
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
                          <Badge className={`text-xs ${getStatusColor(mostRecentWatch?.status ?? "planned")}`}>
                            {getStatusLabel(mostRecentWatch?.status ?? "planned")}
                          </Badge>
                          {mostRecentWatch?.platform && (
                            <span className="text-sm text-zinc-500">
                              {mostRecentWatch.platform}
                            </span>
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
                          TMDB: {entry.voteAverage.toFixed(1)}/10
                        </span>
                      )}
                      {mostRecentWatch?.startDate && (
                        <span>
                          {formatDate(mostRecentWatch.startDate)}
                          {mostRecentWatch.endDate &&
                            mostRecentWatch.endDate !== mostRecentWatch.startDate &&
                            ` → ${formatDate(mostRecentWatch.endDate)}`}
                        </span>
                      )}
                      {entry.mediaType === "movie" && entry.runtime && (
                        <span>{entry.runtime} min</span>
                      )}
                      {entry.mediaType === "tv" && entry.numberOfSeasons && (
                        <span>{entry.numberOfSeasons} seasons</span>
                      )}
                    </div>
                    {entry.genres && entry.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.genres.slice(0, 3).map((genre) => (
                          <Badge key={genre.id} variant="secondary" className="text-xs">
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

      <AddEntryModal
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        onSubmit={handleAddEntry}
        lists={lists}
        defaultListId={defaultListId}
      />

      <EditEntryModal
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        entry={editingEntry}
        onAddWatch={(entryId, data) =>
          addWatch(editingEntry?.listId ?? "", entryId, data)
        }
        onUpdateWatch={(entryId, watchId, data) =>
          updateWatch(editingEntry?.listId ?? "", entryId, watchId, data)
        }
        onDeleteWatch={(entryId, watchId) =>
          deleteWatch(editingEntry?.listId ?? "", entryId, watchId)
        }
        onDeleteEntry={(entryId) =>
          deleteEntry(editingEntry?.listId ?? "", entryId)
        }
        onUpdateEntryPlatform={(entryId, platform) =>
          updateEntryPlatform(editingEntry?.listId ?? "", entryId, platform)
        }
      />
    </div>
  )
}

export default Home
