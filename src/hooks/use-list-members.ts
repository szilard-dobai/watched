"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { listApi, type Member } from "@/lib/api/fetchers"

export const useListMembers = (listId: string) => {
  const queryClient = useQueryClient()

  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.lists.members(listId),
    queryFn: () => listApi.getMembers(listId),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => listApi.removeMember(listId, userId),
    onSuccess: (_, userId) => {
      queryClient.setQueryData<Member[]>(
        queryKeys.lists.members(listId),
        (old) => old?.filter((m) => m.userId !== userId) ?? []
      )
    },
  })

  const removeMember = async (userId: string): Promise<boolean> => {
    try {
      await removeMemberMutation.mutateAsync(userId)
      return true
    } catch {
      return false
    }
  }

  return {
    members,
    isLoading,
    error: error instanceof Error ? error.message : null,
    removeMember,
    isRemoving: removeMemberMutation.isPending,
    removingUserId: removeMemberMutation.variables,
  }
}
