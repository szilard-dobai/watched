"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { entryApi } from "@/lib/api/fetchers"

export const useSharedEntries = () => {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.entries.shared,
    queryFn: entryApi.getShared,
  })

  return {
    entries,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}
