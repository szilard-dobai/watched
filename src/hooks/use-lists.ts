"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { listApi } from "@/lib/api/fetchers"
import type { ListWithRole } from "@/types"

export const useLists = () => {
  const queryClient = useQueryClient()

  const {
    data: lists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: listApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: listApi.create,
    onSuccess: (newList) => {
      queryClient.setQueryData<ListWithRole[]>(queryKeys.lists.all, (old) =>
        old ? [...old, newList] : [newList]
      )
    },
  })

  const leaveMutation = useMutation({
    mutationFn: listApi.leave,
    onSuccess: (_, listId) => {
      queryClient.setQueryData<ListWithRole[]>(queryKeys.lists.all, (old) =>
        old ? old.filter((l) => l._id !== listId) : []
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: listApi.delete,
    onSuccess: (_, listId) => {
      queryClient.setQueryData<ListWithRole[]>(queryKeys.lists.all, (old) =>
        old ? old.filter((l) => l._id !== listId) : []
      )
      queryClient.removeQueries({ queryKey: queryKeys.entries.byList(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all })
    },
  })

  const createList = async (name: string): Promise<ListWithRole | null> => {
    try {
      return await createMutation.mutateAsync(name)
    } catch {
      return null
    }
  }

  const leaveList = async (listId: string): Promise<boolean> => {
    try {
      await leaveMutation.mutateAsync(listId)
      return true
    } catch {
      return false
    }
  }

  const deleteList = async (listId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(listId)
      return true
    } catch {
      return false
    }
  }

  return {
    lists,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createList,
    leaveList,
    deleteList,
  }
}
