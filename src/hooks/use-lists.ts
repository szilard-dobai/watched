"use client"

import { useState, useEffect, useCallback } from "react"
import type { ListWithRole } from "@/types"

export const useLists = () => {
  const [lists, setLists] = useState<ListWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/lists")
      if (!response.ok) {
        throw new Error("Failed to fetch lists")
      }
      const data = await response.json()
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const createList = async (name: string): Promise<ListWithRole | null> => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? "Failed to create list")
      }

      const newList = await response.json()
      setLists((prev) => [...prev, newList])
      return newList
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return null
    }
  }

  const leaveList = async (listId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${listId}/leave`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? "Failed to leave list")
      }

      setLists((prev) => prev.filter((l) => l._id !== listId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  const deleteList = async (listId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? "Failed to delete list")
      }

      setLists((prev) => prev.filter((l) => l._id !== listId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    }
  }

  return {
    lists,
    isLoading,
    error,
    refetch: fetchLists,
    createList,
    leaveList,
    deleteList,
  }
}
