"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { entryApi } from "@/lib/api/fetchers"
import type { Entry, EntryStatus } from "@/types"

export interface EntryWithList extends Entry {
  listName: string
}

export const useAllEntries = () => {
  const queryClient = useQueryClient()

  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.entries.all,
    queryFn: entryApi.getAll,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      status,
    }: {
      listId: string
      entryId: string
      status: EntryStatus
    }) => entryApi.update(listId, entryId, { watchStatus: status }),
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) =>
          e._id === updatedEntry._id ? { ...e, ...updatedEntry } : e
        ) ?? []
      )
    },
  })

  const addWatchMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      watchData,
    }: {
      listId: string
      entryId: string
      watchData: {
        startDate?: string
        endDate?: string
        platform?: string
        notes?: string
      }
    }) => entryApi.addWatch(listId, entryId, watchData as { startDate: string }),
    onSuccess: (newWatch, { entryId }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) =>
          e._id === entryId ? { ...e, watches: [...e.watches, newWatch] } : e
        ) ?? []
      )
    },
  })

  const deleteWatchMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      watchId,
    }: {
      listId: string
      entryId: string
      watchId: string
    }) => entryApi.deleteWatch(listId, entryId, watchId),
    onSuccess: (_, { entryId, watchId }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) =>
          e._id === entryId
            ? { ...e, watches: e.watches.filter((w) => w._id !== watchId) }
            : e
        ) ?? []
      )
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: ({ listId, entryId }: { listId: string; entryId: string }) =>
      entryApi.delete(listId, entryId),
    onSuccess: (_, { entryId }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.filter((e) => e._id !== entryId) ?? []
      )
    },
  })

  const updateStatus = async (
    listId: string,
    entryId: string,
    status: EntryStatus
  ): Promise<boolean> => {
    try {
      await updateStatusMutation.mutateAsync({ listId, entryId, status })
      return true
    } catch {
      return false
    }
  }

  const addWatch = async (
    listId: string,
    entryId: string,
    watchData: {
      startDate?: string
      endDate?: string
      platform?: string
      notes?: string
    }
  ): Promise<boolean> => {
    try {
      await addWatchMutation.mutateAsync({ listId, entryId, watchData })
      return true
    } catch {
      return false
    }
  }

  const deleteWatch = async (
    listId: string,
    entryId: string,
    watchId: string
  ): Promise<boolean> => {
    try {
      await deleteWatchMutation.mutateAsync({ listId, entryId, watchId })
      return true
    } catch {
      return false
    }
  }

  const deleteEntry = async (
    listId: string,
    entryId: string
  ): Promise<boolean> => {
    try {
      await deleteEntryMutation.mutateAsync({ listId, entryId })
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
    updateStatus,
    addWatch,
    deleteWatch,
    deleteEntry,
  }
}
