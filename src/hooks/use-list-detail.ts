"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { listApi } from "@/lib/api/fetchers"
import type { ListWithRole } from "@/types"

export const useListDetail = (listId: string) => {
  const queryClient = useQueryClient()

  const {
    data: list,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.lists.detail(listId),
    queryFn: () => listApi.getById(listId),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; regenerateInviteCode?: boolean }) =>
      listApi.update(listId, data),
    onSuccess: (updatedList) => {
      queryClient.setQueryData<ListWithRole>(
        queryKeys.lists.detail(listId),
        updatedList
      )
      queryClient.setQueryData<ListWithRole[]>(queryKeys.lists.all, (old) =>
        old?.map((l) => (l._id === listId ? { ...l, ...updatedList } : l))
      )
    },
  })

  const updateList = async (data: {
    name?: string
    regenerateInviteCode?: boolean
  }): Promise<ListWithRole | null> => {
    try {
      return await updateMutation.mutateAsync(data)
    } catch {
      return null
    }
  }

  return {
    list,
    isLoading,
    error: error instanceof Error ? error.message : null,
    updateList,
    isUpdating: updateMutation.isPending,
  }
}
