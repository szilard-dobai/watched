"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { tmdbApi } from "@/lib/api/fetchers"

export const useTmdbSearch = (query: string, enabled: boolean = true) => {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.tmdb.search(query),
    queryFn: () => tmdbApi.search(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    results: data?.results ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
