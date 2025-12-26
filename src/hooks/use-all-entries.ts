"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { entryApi } from "@/lib/api/fetchers"
import type { Entry } from "@/types"

export interface EntryWithList extends Entry {
  listName: string
}

export const useAllEntries = () => {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.entries.all,
    queryFn: entryApi.getAll,
  })

  return {
    entries,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}
