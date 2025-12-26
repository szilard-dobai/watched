"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { listApi } from "@/lib/api/fetchers"
import type { ListWithRole } from "@/types"

export const useJoinList = (inviteCode: string, enabled: boolean = true) => {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.join.info(inviteCode),
    queryFn: () => listApi.getJoinInfo(inviteCode),
    enabled,
    retry: false,
  })

  const joinMutation = useMutation({
    mutationFn: () => listApi.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all })
    },
  })

  const join = async (): Promise<ListWithRole | null> => {
    try {
      return await joinMutation.mutateAsync()
    } catch {
      return null
    }
  }

  return {
    listName: data?.name ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    join,
    isJoining: joinMutation.isPending,
    joinError: joinMutation.error instanceof Error ? joinMutation.error.message : null,
  }
}
