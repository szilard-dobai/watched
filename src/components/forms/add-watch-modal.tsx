"use client"

import { useState } from "react"
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
import { PLATFORMS } from "@/lib/constants"
import type { Entry } from "@/types"

interface AddWatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    startDate: string
    endDate?: string
    platform?: string
    notes?: string
  }) => Promise<void>
  entry: Entry
}

export const AddWatchModal = ({
  open,
  onOpenChange,
  onSubmit,
  entry,
}: AddWatchModalProps) => {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [platform, setPlatform] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleClose = () => {
    setStartDate("")
    setEndDate("")
    setPlatform("")
    setNotes("")
    setError("")
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate) return

    setIsSubmitting(true)
    setError("")

    try {
      await onSubmit({
        startDate,
        endDate: endDate || undefined,
        platform: platform || undefined,
        notes: notes || undefined,
      })
      handleClose()
    } catch {
      setError("Failed to add watch")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Rewatch</DialogTitle>
          <DialogDescription>
            Log another watch of &ldquo;{entry.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !startDate}>
              {isSubmitting ? "Adding..." : "Log Watch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
