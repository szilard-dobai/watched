"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { entryApi } from "@/lib/api/fetchers"
import type { Entry, EntryFormData } from "@/types"

export const useEntries = (listId: string | null) => {
  const queryClient = useQueryClient()

  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: listId ? queryKeys.entries.byList(listId) : ["disabled"],
    queryFn: () => (listId ? entryApi.getByList(listId) : Promise.resolve([])),
    enabled: !!listId,
  })

  const addEntryMutation = useMutation({
    mutationFn: (data: EntryFormData) => {
      if (!listId) throw new Error("No list selected")
      return entryApi.create(listId, data)
    },
    onSuccess: (newEntry) => {
      if (!listId) return
      queryClient.setQueryData<Entry[]>(
        queryKeys.entries.byList(listId),
        (old) => (old ? [newEntry, ...old] : [newEntry])
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const updateEntryMutation = useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string
      data: Partial<Entry>
    }) => {
      if (!listId) throw new Error("No list selected")
      return entryApi.update(listId, entryId, data)
    },
    onSuccess: (updatedEntry) => {
      if (!listId) return
      queryClient.setQueryData<Entry[]>(
        queryKeys.entries.byList(listId),
        (old) =>
          old?.map((e) => (e._id === updatedEntry._id ? updatedEntry : e)) ?? []
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => {
      if (!listId) throw new Error("No list selected")
      return entryApi.delete(listId, entryId)
    },
    onSuccess: (_, entryId) => {
      if (!listId) return
      queryClient.setQueryData<Entry[]>(
        queryKeys.entries.byList(listId),
        (old) => old?.filter((e) => e._id !== entryId) ?? []
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const addWatchMutation = useMutation({
    mutationFn: ({
      entryId,
      watchData,
    }: {
      entryId: string
      watchData: {
        startDate: string
        endDate?: string
        platform?: string
        notes?: string
      }
    }) => {
      if (!listId) throw new Error("No list selected")
      return entryApi.addWatch(listId, entryId, watchData)
    },
    onSuccess: (newWatch, { entryId }) => {
      if (!listId) return
      queryClient.setQueryData<Entry[]>(
        queryKeys.entries.byList(listId),
        (old) =>
          old?.map((e) =>
            e._id === entryId ? { ...e, watches: [...e.watches, newWatch] } : e
          ) ?? []
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const deleteWatchMutation = useMutation({
    mutationFn: ({ entryId, watchId }: { entryId: string; watchId: string }) => {
      if (!listId) throw new Error("No list selected")
      return entryApi.deleteWatch(listId, entryId, watchId)
    },
    onSuccess: (_, { entryId, watchId }) => {
      if (!listId) return
      queryClient.setQueryData<Entry[]>(
        queryKeys.entries.byList(listId),
        (old) =>
          old?.map((e) =>
            e._id === entryId
              ? { ...e, watches: e.watches.filter((w) => w._id !== watchId) }
              : e
          ) ?? []
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const addEntry = async (data: EntryFormData): Promise<Entry | null> => {
    try {
      return await addEntryMutation.mutateAsync(data)
    } catch {
      return null
    }
  }

  const updateEntry = async (
    entryId: string,
    data: Partial<Entry>
  ): Promise<boolean> => {
    try {
      await updateEntryMutation.mutateAsync({ entryId, data })
      return true
    } catch {
      return false
    }
  }

  const deleteEntry = async (entryId: string): Promise<boolean> => {
    try {
      await deleteEntryMutation.mutateAsync(entryId)
      return true
    } catch {
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
    try {
      await addWatchMutation.mutateAsync({ entryId, watchData })
      return true
    } catch {
      return false
    }
  }

  const deleteWatch = async (
    entryId: string,
    watchId: string
  ): Promise<boolean> => {
    try {
      await deleteWatchMutation.mutateAsync({ entryId, watchId })
      return true
    } catch {
      return false
    }
  }

  return {
    entries,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    addEntry,
    updateEntry,
    deleteEntry,
    addWatch,
    deleteWatch,
  }
}
