"use client"

import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { tmdbApi } from "@/lib/api/fetchers"

export const useTmdbDetails = (
  mediaType: string | null,
  id: number | null
) => {
  const {
    data: details,
    isLoading,
    error,
  } = useQuery({
    queryKey:
      mediaType && id ? queryKeys.tmdb.details(mediaType, id) : ["disabled"],
    queryFn: () => {
      if (!mediaType || !id) throw new Error("Invalid parameters")
      return tmdbApi.getDetails(mediaType, id)
    },
    enabled: !!mediaType && !!id,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  return {
    details: details ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
