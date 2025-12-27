"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { entryApi } from "@/lib/api/fetchers"
import type { Entry, WatchFormData } from "@/types"

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

  const addWatchMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      watchData,
    }: {
      listId: string
      entryId: string
      watchData: WatchFormData
    }) => entryApi.addWatch(listId, entryId, watchData),
    onSuccess: (newWatch, { entryId }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) =>
          e._id === entryId ? { ...e, watches: [...e.watches, newWatch] } : e
        ) ?? []
      )
    },
  })

  const updateWatchMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      watchId,
      watchData,
    }: {
      listId: string
      entryId: string
      watchId: string
      watchData: WatchFormData
    }) => entryApi.updateWatch(listId, entryId, watchId, watchData),
    onSuccess: (_, { entryId, watchId, watchData }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) =>
          e._id === entryId
            ? {
                ...e,
                watches: e.watches.map((w) =>
                  w._id === watchId ? { ...w, ...watchData } : w
                ),
              }
            : e
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

  const updateEntryPlatformMutation = useMutation({
    mutationFn: ({
      listId,
      entryId,
      platform,
    }: {
      listId: string
      entryId: string
      platform: string
    }) => entryApi.update(listId, entryId, { platform }),
    onSuccess: (_, { entryId, platform }) => {
      queryClient.setQueryData<EntryWithList[]>(queryKeys.entries.all, (old) =>
        old?.map((e) => (e._id === entryId ? { ...e, platform } : e)) ?? []
      )
    },
  })

  const addWatch = async (
    listId: string,
    entryId: string,
    watchData: WatchFormData
  ): Promise<boolean> => {
    try {
      await addWatchMutation.mutateAsync({ listId, entryId, watchData })
      return true
    } catch {
      return false
    }
  }

  const updateWatch = async (
    listId: string,
    entryId: string,
    watchId: string,
    watchData: WatchFormData
  ): Promise<boolean> => {
    try {
      await updateWatchMutation.mutateAsync({ listId, entryId, watchId, watchData })
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

  const updateEntryPlatform = async (
    listId: string,
    entryId: string,
    platform: string
  ): Promise<boolean> => {
    try {
      await updateEntryPlatformMutation.mutateAsync({ listId, entryId, platform })
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
    addWatch,
    updateWatch,
    deleteWatch,
    deleteEntry,
    updateEntryPlatform,
  }
}
