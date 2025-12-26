"use client"

import { useState, useEffect, useCallback } from "react"
import type { Entry } from "@/types"

export interface EntryWithList extends Entry {
  listName: string
}

export const useAllEntries = () => {
  const [entries, setEntries] = useState<EntryWithList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/entries")
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
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return {
    entries,
    isLoading,
    error,
    refetch: fetchEntries,
  }
}
