"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Film, Tv, Eye, List, Popcorn } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserMenu } from "@/components/auth/user-menu"
import { AddEntryModal } from "@/components/forms/add-entry-modal"
import { useAllEntries, type EntryWithList } from "@/hooks/use-all-entries"
import { useLists } from "@/hooks/use-lists"
import { entryApi } from "@/lib/api/fetchers"
import { PLATFORMS, MEDIA_TYPE_OPTIONS } from "@/lib/constants"
import type { DashboardFilterState, MediaType, EntryFormData } from "@/types"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

const Home = () => {
  const { data: session } = useSession()
  const { entries, isLoading: isEntriesLoading, refetch } = useAllEntries()
  const { lists, isLoading: isListsLoading } = useLists()

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)

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
    return entry.watches.reduce((latest, watch) =>
      new Date(watch.addedAt) > new Date(latest.addedAt) ? watch : latest
    )
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

        <div className="mb-6 flex flex-wrap gap-3">
          <Input
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full sm:w-64"
          />
          <select
            value={filters.listId}
            onChange={(e) => setFilters((f) => ({ ...f, listId: e.target.value }))}
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="all">All Lists</option>
            {lists.map((list) => (
              <option key={list._id} value={list._id}>
                {list.name}
              </option>
            ))}
          </select>
          <select
            value={filters.mediaType}
            onChange={(e) =>
              setFilters((f) => ({ ...f, mediaType: e.target.value as MediaType | "all" }))
            }
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {MEDIA_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.genre}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="all">All Genres</option>
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            value={filters.platform}
            onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEntries.map((entry) => {
              const mostRecentWatch = getMostRecentWatch(entry)
              return (
                <Link
                  key={entry._id}
                  href={`/lists/${entry.listId}`}
                  className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
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
                  <div className="p-3">
                    <h3 className="font-medium line-clamp-1" title={entry.title}>
                      {entry.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {entry.mediaType === "movie" ? "Movie" : "TV"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {entry.listName}
                      </Badge>
                    </div>
                    {mostRecentWatch && (
                      <p className="mt-2 text-xs text-zinc-500">
                        {formatDate(mostRecentWatch.startDate)}
                        {mostRecentWatch.platform && ` • ${mostRecentWatch.platform}`}
                      </p>
                    )}
                  </div>
                </Link>
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
    </div>
  )
}

export default Home
