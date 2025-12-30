"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DATE_FILTER_OPERATORS,
  ENTRY_STATUS_OPTIONS,
  MEDIA_TYPE_OPTIONS,
  PLATFORMS,
  SORT_OPTIONS,
  USER_RATING_FILTER_OPTIONS,
} from "@/lib/constants"
import type {
  DashboardFilterState,
  DashboardSortState,
  DateFilterOperator,
  EntryStatus,
  ListWithRole,
  MediaType,
  SortField,
  UserRatingValue,
} from "@/types"
import { ArrowDownAZ, ArrowUpAZ, RotateCcw, X } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DashboardFilterState
  setFilters: (value: DashboardFilterState | ((prev: DashboardFilterState) => DashboardFilterState)) => void
  sort: DashboardSortState
  setSort: (value: DashboardSortState | ((prev: DashboardSortState) => DashboardSortState)) => void
  lists: ListWithRole[]
  allGenres: string[]
  onReset: () => void
  hasActiveFilters: boolean
}

export const FilterModal = ({
  open,
  onOpenChange,
  filters,
  setFilters,
  sort,
  setSort,
  lists,
  allGenres,
  onReset,
  hasActiveFilters,
}: FilterModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filters & Sorting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Search</label>
            <Input
              placeholder="Search titles..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">List</label>
              <Select
                value={filters.listId}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, listId: value }))
                }
              >
                <SelectTrigger>
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
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <Select
                value={filters.mediaType}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    mediaType: value as MediaType | "all",
                  }))
                }
              >
                <SelectTrigger>
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
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    status: value as EntryStatus | "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ENTRY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Genre</label>
              <Select
                value={filters.genre}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, genre: value }))
                }
              >
                <SelectTrigger>
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
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Platform</label>
              <Select
                value={filters.platform}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, platform: value }))
                }
              >
                <SelectTrigger>
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
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Your Rating</label>
              <Select
                value={filters.userRating}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    userRating: value as UserRatingValue | "none" | "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  {USER_RATING_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Owner Rating</label>
              <Select
                value={filters.ownerRating}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    ownerRating: value as UserRatingValue | "none" | "all",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  {USER_RATING_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <label className="mb-1.5 block text-sm font-medium">Watch Start Date</label>
            <div className="flex gap-2">
              <Select
                value={filters.startDate?.operator ?? "any"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    startDate: value === "any"
                      ? null
                      : { operator: value as DateFilterOperator, date: f.startDate?.date ?? new Date().toISOString() },
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {DATE_FILTER_OPERATORS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.startDate && (
                <>
                  <DatePicker
                    date={filters.startDate.date ? new Date(filters.startDate.date) : undefined}
                    onDateChange={(date) =>
                      setFilters((f) => ({
                        ...f,
                        startDate: date
                          ? { operator: f.startDate?.operator ?? ">=", date: date.toISOString() }
                          : null,
                      }))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFilters((f) => ({ ...f, startDate: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Watch End Date</label>
            <div className="flex gap-2">
              <Select
                value={filters.endDate?.operator ?? "any"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    endDate: value === "any"
                      ? null
                      : { operator: value as DateFilterOperator, date: f.endDate?.date ?? new Date().toISOString() },
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {DATE_FILTER_OPERATORS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.endDate && (
                <>
                  <DatePicker
                    date={filters.endDate.date ? new Date(filters.endDate.date) : undefined}
                    onDateChange={(date) =>
                      setFilters((f) => ({
                        ...f,
                        endDate: date
                          ? { operator: f.endDate?.operator ?? "<=", date: date.toISOString() }
                          : null,
                      }))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFilters((f) => ({ ...f, endDate: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <label className="mb-1.5 block text-sm font-medium">Sort by</label>
            <div className="flex gap-2">
              <Select
                value={sort.field}
                onValueChange={(value) =>
                  setSort((s) => ({ ...s, field: value as SortField }))
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
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
            </div>
          </div>

          <div className="flex justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset All
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
