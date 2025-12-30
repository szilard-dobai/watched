"use client";

import { AddEntryModal } from "@/components/forms/add-entry-modal";
import { CSVImportModal } from "@/components/forms/csv-import-modal";
import { EditEntryModal } from "@/components/forms/edit-entry-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterModal } from "@/components/ui/filter-modal";
import Header from "@/components/ui/header";
import { MobileFab } from "@/components/mobile-fab";
import { Input } from "@/components/ui/input";
import { RatingInput } from "@/components/ui/rating-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAllEntries } from "@/hooks/use-all-entries";
import { useLists } from "@/hooks/use-lists";
import { entryApi } from "@/lib/api/fetchers";
import { useSession } from "@/lib/auth-client";
import type {
  DashboardFilterState,
  DashboardSortState,
  EntryFormData,
  EntryStatus,
  SortField,
  UserRatingValue,
} from "@/types";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Film,
  Filter,
  LayoutGrid,
  LayoutList,
  List,
  Plus,
  Star,
  Table,
  Tv,
  Upload,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

const DEFAULT_FILTERS: DashboardFilterState = {
  search: "",
  listId: "all",
  mediaType: "all",
  genre: "all",
  platform: "all",
  status: "all",
  userRating: "all",
  ownerRating: "all",
};

const DEFAULT_SORT: DashboardSortState = {
  field: "date",
  direction: "desc",
};

const Home = () => {
  const { data: session } = useSession();
  const {
    entries,
    isLoading: isEntriesLoading,
    refetch,
    addWatch,
    updateWatch,
    deleteWatch,
    deleteEntry,
    updateEntryPlatform,
    updateRating,
  } = useAllEntries();
  const { lists, isLoading: isListsLoading } = useLists();

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<"gallery" | "list" | "table">(
    "dashboard-view-mode",
    "gallery"
  );

  const editableEntries = useMemo(() => {
    const listRoleMap = new Map(lists.map((l) => [l._id, l.role]));
    return entries.filter((entry) => {
      const role = listRoleMap.get(entry.listId);
      return role === "owner" || role === "member";
    });
  }, [entries, lists]);

  const editableLists = useMemo(
    () => lists.filter((list) => list.role !== "viewer"),
    [lists]
  );

  const hasViewerLists = useMemo(
    () => lists.some((list) => list.role === "viewer"),
    [lists]
  );

  const editingEntry = useMemo(
    () => editableEntries.find((e) => e._id === editingEntryId) ?? null,
    [editableEntries, editingEntryId]
  );

  const [filters, setFilters] = useLocalStorage<DashboardFilterState>(
    "dashboard-filters",
    DEFAULT_FILTERS
  );

  const [sort, setSort] = useLocalStorage<DashboardSortState>(
    "dashboard-sort",
    DEFAULT_SORT
  );

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.listId !== "all" ||
    filters.mediaType !== "all" ||
    filters.genre !== "all" ||
    filters.platform !== "all" ||
    filters.status !== "all" ||
    filters.userRating !== "all" ||
    filters.ownerRating !== "all" ||
    sort.field !== "date" ||
    sort.direction !== "desc";

  const activeFilterCount = [
    filters.search !== "",
    filters.listId !== "all",
    filters.mediaType !== "all",
    filters.genre !== "all",
    filters.platform !== "all",
    filters.status !== "all",
    filters.userRating !== "all",
    filters.ownerRating !== "all",
  ].filter(Boolean).length;

  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    editableEntries.forEach((entry) => {
      entry.genres?.forEach((g) => genreSet.add(g.name));
    });
    return Array.from(genreSet).sort();
  }, [editableEntries]);

  const stats = useMemo(() => {
    const totalMovies = editableEntries.filter(
      (e) => e.mediaType === "movie"
    ).length;
    const totalTvShows = editableEntries.filter(
      (e) => e.mediaType === "tv"
    ).length;
    const planned = editableEntries.filter(
      (e) => e.entryStatus === "planned"
    ).length;
    const watching = editableEntries.filter(
      (e) => e.entryStatus === "in_progress"
    ).length;
    const finished = editableEntries.filter(
      (e) => e.entryStatus === "finished"
    ).length;

    return {
      totalMovies,
      totalTvShows,
      planned,
      watching,
      finished,
    };
  }, [editableEntries]);

  const filteredAndSortedEntries = useMemo(() => {
    const getEntryPlatform = (entry: (typeof editableEntries)[0]) =>
      entry.lastPlatform || entry.platform || null;

    const userRatingOrder: Record<UserRatingValue, number> = {
      disliked: 1,
      liked: 2,
      loved: 3,
    };

    const statusOrder: Record<EntryStatus, number> = {
      planned: 1,
      in_progress: 2,
      finished: 3,
    };

    const filtered = editableEntries.filter((entry) => {
      if (
        filters.search &&
        !entry.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.listId !== "all" && entry.listId !== filters.listId) {
        return false;
      }
      if (
        filters.mediaType !== "all" &&
        entry.mediaType !== filters.mediaType
      ) {
        return false;
      }
      if (
        filters.genre !== "all" &&
        !entry.genres?.some((g) => g.name === filters.genre)
      ) {
        return false;
      }
      if (filters.platform !== "all") {
        const entryPlatform = getEntryPlatform(entry);
        if (entryPlatform !== filters.platform) return false;
      }
      if (filters.status !== "all" && entry.entryStatus !== filters.status) {
        return false;
      }
      if (filters.userRating !== "all") {
        if (filters.userRating === "none") {
          if (entry.userRating) return false;
        } else {
          if (entry.userRating !== filters.userRating) return false;
        }
      }
      if (filters.ownerRating !== "all") {
        if (filters.ownerRating === "none") {
          if (entry.ownerRating) return false;
        } else {
          if (entry.ownerRating !== filters.ownerRating) return false;
        }
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;

      switch (sort.field) {
        case "title":
          return dir * a.title.localeCompare(b.title);

        case "listName":
          return dir * a.listName.localeCompare(b.listName);

        case "mediaType":
          return dir * a.mediaType.localeCompare(b.mediaType);

        case "date": {
          const dateA = a.lastStartDate;
          const dateB = b.lastStartDate;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dir * dateA.localeCompare(dateB);
        }

        case "endDate": {
          const dateA = a.lastEndDate;
          const dateB = b.lastEndDate;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dir * dateA.localeCompare(dateB);
        }

        case "status":
          return (
            dir * (statusOrder[a.entryStatus] - statusOrder[b.entryStatus])
          );

        case "platform": {
          const platformA = getEntryPlatform(a) || "";
          const platformB = getEntryPlatform(b) || "";
          if (!platformA && !platformB) return 0;
          if (!platformA) return 1;
          if (!platformB) return -1;
          return dir * platformA.localeCompare(platformB);
        }

        case "voteAverage":
          return dir * (a.voteAverage - b.voteAverage);

        case "userRating": {
          const ratingA = a.userRating ? userRatingOrder[a.userRating] : 0;
          const ratingB = b.userRating ? userRatingOrder[b.userRating] : 0;
          return dir * (ratingA - ratingB);
        }

        case "ownerRating": {
          const ratingA = a.ownerRating ? userRatingOrder[a.ownerRating] : 0;
          const ratingB = b.ownerRating ? userRatingOrder[b.ownerRating] : 0;
          return dir * (ratingA - ratingB);
        }

        case "watchCount":
          return dir * (a.watches.length - b.watches.length);

        case "createdAt":
          return dir * a.createdAt.localeCompare(b.createdAt);

        default:
          return 0;
      }
    });

    return sorted;
  }, [editableEntries, filters, sort]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddEntry = async (listId: string, data: EntryFormData) => {
    await entryApi.create(listId, data);
    refetch();
  };

  const handleTableSort = (field: SortField) => {
    if (sort.field === field) {
      setSort((s) => ({
        ...s,
        direction: s.direction === "asc" ? "desc" : "asc",
      }));
    } else {
      setSort({ field, direction: "desc" });
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sort.field !== field) return null;
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (!session) {
    return null;
  }

  const defaultListId = editableLists[0]?._id;

  const isLoading = isEntriesLoading || isListsLoading;
  const canAddEntry = editableLists.length > 0;
  const hasMultipleLists = editableLists.length > 1;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header>
        {canAddEntry && (
          <>
            <Button
              size="sm"
              onClick={() => setIsAddEntryOpen(true)}
              className="hidden lg:inline-flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="hidden lg:inline-flex"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </>
        )}
        {hasViewerLists && (
          <Link href="/shared">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Shared
            </Button>
          </Link>
        )}
        <Link href="/lists">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" />
            My Lists
          </Button>
        </Link>
      </Header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.status === "planned"
                ? "ring-2 ring-zinc-500 bg-zinc-100 dark:bg-zinc-900"
                : ""
            }`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                status: f.status === "planned" ? "all" : "planned",
              }))
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.planned}</p>
                <p className="text-sm text-zinc-500">Planned</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.status === "in_progress"
                ? "ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                : ""
            }`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                status: f.status === "in_progress" ? "all" : "in_progress",
              }))
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.watching}</p>
                <p className="text-sm text-zinc-500">Watching</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.status === "finished"
                ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950"
                : ""
            }`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                status: f.status === "finished" ? "all" : "finished",
              }))
            }
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.finished}</p>
                <p className="text-sm text-zinc-500">Finished</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Input
            placeholder="Search titles..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="flex-1 sm:max-w-xs"
          />
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className="relative ms-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
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
            {editableEntries.length === 0 ? (
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
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("mediaType")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Type {renderSortIcon("mediaType")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("status")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Status {renderSortIcon("status")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("platform")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Platform {renderSortIcon("platform")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("date")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Started {renderSortIcon("date")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("endDate")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Ended {renderSortIcon("endDate")}
                    </span>
                  </th>
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
                      Owner&apos;s Rating {renderSortIcon("ownerRating")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("userRating")}
                  >
                    <span className="inline-flex items-center gap-1 text-nowrap">
                      My Rating {renderSortIcon("userRating")}
                    </span>
                  </th>
                  <th
                    className="px-3 py-2 text-center font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 select-none"
                    onClick={() => handleTableSort("watchCount")}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      Watches {renderSortIcon("watchCount")}
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
                    onClick={() => setEditingEntryId(entry._id)}
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
                    <td className="px-3 py-2">
                      <StatusBadge status={entry.entryStatus} />
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {entry.lastPlatform || entry.platform || "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {entry.lastStartDate
                        ? formatDate(entry.lastStartDate)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {entry.lastEndDate ? formatDate(entry.lastEndDate) : "—"}
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
                      {entry.userRating ? (
                        <RatingInput
                          value={entry.userRating}
                          size="sm"
                          readonly
                        />
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {entry.watches.length || "—"}
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
              const rating = Math.round(entry.voteAverage * 10) / 10;
              const genres = entry.genres?.map((g) => g.name).join(", ") || "";
              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setEditingEntryId(entry._id)}
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

                    <div className="absolute left-3 top-3">
                      <StatusBadge status={entry.entryStatus} />
                    </div>

                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-white">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {rating}
                      </span>
                    </div>

                    {entry.userRating && (
                      <div className="absolute left-3 bottom-3">
                        <RatingInput
                          value={entry.userRating}
                          size="sm"
                          readonly
                        />
                      </div>
                    )}

                    {!!entry.watches.length && (
                      <div className="absolute right-3 bottom-3">
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800">
                          {entry.watches.length} watch
                          {entry.watches.length > 1 && "es"}
                        </span>
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
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {entry.lastPlatform || entry.platform}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {entry.lastStartDate && (
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(entry.lastStartDate)}
                          {entry.lastEndDate &&
                            entry.lastEndDate !== entry.lastStartDate &&
                            ` → ${formatDate(entry.lastEndDate)}`}
                        </p>
                      )}
                      {genres && (
                        <p className="line-clamp-1 text-ellipsis">{genres}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedEntries.map((entry) => {
              const rating = Math.round(entry.voteAverage * 10) / 10;

              return (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setEditingEntryId(entry._id)}
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
                          <StatusBadge status={entry.entryStatus} />
                          {!!entry.watches.length && (
                            <Badge className="bg-purple-100 text-purple-800">
                              {entry.watches.length} watch
                              {entry.watches.length > 1 && "es"}
                            </Badge>
                          )}
                          {hasMultipleLists && (
                            <span className="text-sm text-zinc-500">
                              {entry.listName}
                            </span>
                          )}
                          <span className="text-sm text-zinc-500">
                            {entry.lastPlatform || entry.platform}
                          </span>
                          {entry.userRating && (
                            <RatingInput
                              value={entry.userRating}
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
                      {entry.lastStartDate && (
                        <span>
                          {formatDate(entry.lastStartDate)}
                          {entry.lastEndDate &&
                            entry.lastEndDate !== entry.lastStartDate &&
                            ` → ${formatDate(entry.lastEndDate)}`}
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
              );
            })}
          </div>
        )}
      </main>

      <AddEntryModal
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        onSubmit={handleAddEntry}
        lists={editableLists}
        defaultListId={defaultListId}
      />

      {editingEntry && (
        <EditEntryModal
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntryId(null)}
          entry={editingEntry}
          listId={editingEntry.listId}
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
          onUpdateRating={(entryId, rating) =>
            updateRating(editingEntry?.listId ?? "", entryId, rating)
          }
          onMediaUpdated={() => refetch()}
        />
      )}

      <FilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        lists={editableLists}
        allGenres={allGenres}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <CSVImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        lists={editableLists}
        onImportComplete={() => refetch()}
        existingEntries={editableEntries}
      />

      {canAddEntry && (
        <MobileFab
          onAddEntryClick={() => setIsAddEntryOpen(true)}
          onImportClick={() => setIsImportModalOpen(true)}
        />
      )}
    </div>
  );
};

export default Home;
