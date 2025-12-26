"use client"

import { useState, useEffect, useCallback } from "react"
import type { Entry, EntryFormData } from "@/types"

export const useEntries = (listId: string | null) => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!listId) {
      setEntries([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/lists/${listId}/entries`)
      if (!response.ok) {
        throw new Error("Failed to fetch entries")
      }
      const data = await response.json()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const addEntry = async (data: EntryFormData): Promise<Entry | null> => {
    if (!listId) return null

    try {
      const response = await fetch(`/api/lists/${listId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Failed to add entry")
      }

      const newEntry = await response.json()
      setEntries((prev) => [newEntry, ...prev])
      return newEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return null
    }
  }

  const updateEntry = async (
    entryId: string,
    data: Partial<Entry>
  ): Promise<boolean> => {
    if (!listId) return false

    try {
      const response = await fetch(`/api/lists/${listId}/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Failed to update entry")
      }

      const updatedEntry = await response.json()
      setEntries((prev) =>
        prev.map((e) => (e._id === entryId ? updatedEntry : e))
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  const deleteEntry = async (entryId: string): Promise<boolean> => {
    if (!listId) return false

    try {
      const response = await fetch(`/api/lists/${listId}/entries/${entryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Failed to delete entry")
      }

      setEntries((prev) => prev.filter((e) => e._id !== entryId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  const addWatch = async (
    entryId: string,
    watchData: {
      startDate: string
      endDate?: string
      platform?: string
      notes?: string
    }
  ): Promise<boolean> => {
    if (!listId) return false

    try {
      const response = await fetch(
        `/api/lists/${listId}/entries/${entryId}/watches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(watchData),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Failed to add watch")
      }

      const newWatch = await response.json()
      setEntries((prev) =>
        prev.map((e) =>
          e._id === entryId ? { ...e, watches: [...e.watches, newWatch] } : e
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  const deleteWatch = async (
    entryId: string,
    watchId: string
  ): Promise<boolean> => {
    if (!listId) return false

    try {
      const response = await fetch(
        `/api/lists/${listId}/entries/${entryId}/watches/${watchId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? "Failed to delete watch")
      }

      setEntries((prev) =>
        prev.map((e) =>
          e._id === entryId
            ? { ...e, watches: e.watches.filter((w) => w._id !== watchId) }
            : e
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  return {
    entries,
    isLoading,
    error,
    refetch: fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    addWatch,
    deleteWatch,
  }
}
