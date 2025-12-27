"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Plus, Trash2, Film, Tv, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PLATFORMS, ENTRY_STATUS_OPTIONS } from "@/lib/constants"
import type { Entry, EntryStatus } from "@/types"

interface EditEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Entry | null
  onUpdateStatus: (entryId: string, status: EntryStatus) => Promise<boolean>
  onAddWatch: (
    entryId: string,
    data: { startDate?: string; endDate?: string; platform?: string; notes?: string }
  ) => Promise<boolean>
  onDeleteWatch: (entryId: string, watchId: string) => Promise<boolean>
  onDeleteEntry: (entryId: string) => Promise<boolean>
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185"

export const EditEntryModal = ({
  open,
  onOpenChange,
  entry,
  onUpdateStatus,
  onAddWatch,
  onDeleteWatch,
  onDeleteEntry,
}: EditEntryModalProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showAddWatch, setShowAddWatch] = useState(false)
  const [newWatchStartDate, setNewWatchStartDate] = useState<Date | undefined>(undefined)
  const [newWatchEndDate, setNewWatchEndDate] = useState<Date | undefined>(undefined)
  const [newWatchPlatform, setNewWatchPlatform] = useState("")
  const [newWatchNotes, setNewWatchNotes] = useState("")
  const [isAddingWatch, setIsAddingWatch] = useState(false)
  const [deletingWatchId, setDeletingWatchId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleClose = () => {
    setShowAddWatch(false)
    setNewWatchStartDate(undefined)
    setNewWatchEndDate(undefined)
    setNewWatchPlatform("")
    setNewWatchNotes("")
    setError("")
    onOpenChange(false)
  }

  const handleStatusChange = async (newStatus: EntryStatus) => {
    if (!entry || newStatus === entry.watchStatus) return

    setIsUpdatingStatus(true)
    setError("")

    const success = await onUpdateStatus(entry._id, newStatus)
    if (!success) {
      setError("Failed to update status")
    }

    setIsUpdatingStatus(false)
  }

  const handleAddWatch = async () => {
    if (!entry) return

    setIsAddingWatch(true)
    setError("")

    const success = await onAddWatch(entry._id, {
      startDate: newWatchStartDate ? format(newWatchStartDate, "yyyy-MM-dd") : undefined,
      endDate: newWatchEndDate ? format(newWatchEndDate, "yyyy-MM-dd") : undefined,
      platform: newWatchPlatform || undefined,
      notes: newWatchNotes || undefined,
    })

    if (success) {
      setShowAddWatch(false)
      setNewWatchStartDate(undefined)
      setNewWatchEndDate(undefined)
      setNewWatchPlatform("")
      setNewWatchNotes("")
    } else {
      setError("Failed to add watch")
    }

    setIsAddingWatch(false)
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
  const genres = entry.genres?.slice(0, 3).map((g) => g.name).join(", ") || ""
  const sortedWatches = [...entry.watches].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>
            Update status and manage watch history
          </DialogDescription>
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
              <h3 className="font-semibold line-clamp-2">{entry.title}</h3>
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
              {genres && (
                <p className="mt-1 text-sm text-zinc-500">{genres}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={entry.watchStatus}
              onValueChange={(value) => handleStatusChange(value as EntryStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Watch History</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddWatch(!showAddWatch)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Watch
              </Button>
            </div>

            {showAddWatch && (
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <DatePicker
                        date={newWatchStartDate}
                        onDateChange={setNewWatchStartDate}
                        placeholder="Pick date"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <DatePicker
                        date={newWatchEndDate}
                        onDateChange={setNewWatchEndDate}
                        placeholder="Pick date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select value={newWatchPlatform} onValueChange={setNewWatchPlatform}>
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={newWatchNotes}
                      onChange={(e) => setNewWatchNotes(e.target.value)}
                      rows={2}
                      placeholder="Any thoughts..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddWatch(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddWatch}
                      disabled={isAddingWatch}
                    >
                      {isAddingWatch ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {sortedWatches.length === 0 ? (
              <p className="text-sm text-zinc-500">No watch history yet</p>
            ) : (
              <div className="space-y-2">
                {sortedWatches.map((watch) => (
                  <div
                    key={watch._id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                  >
                    <div className="text-sm">
                      {watch.startDate && (
                        <span>{formatDate(watch.startDate)}</span>
                      )}
                      {watch.endDate && watch.endDate !== watch.startDate && (
                        <span> → {formatDate(watch.endDate)}</span>
                      )}
                      {!watch.startDate && !watch.endDate && (
                        <span className="text-zinc-500">No date</span>
                      )}
                      {watch.platform && (
                        <span className="ml-2 text-zinc-500">• {watch.platform}</span>
                      )}
                    </div>
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
                ))}
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
