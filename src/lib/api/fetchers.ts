import type {
  ListWithRole,
  Entry,
  EntryFormData,
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  ListRole,
  WatchFormData,
  UserRatingValue,
  ViewerEntry,
} from "@/types"
import type { EntryWithList } from "@/hooks/use-all-entries"

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error ?? `Request failed: ${response.status}`)
  }
  return response.json()
}

export interface Member {
  _id: string
  userId: string
  role: ListRole
  joinedAt: string
  name: string
  email: string
}

export const listApi = {
  getAll: () => fetchJson<ListWithRole[]>("/api/lists"),

  getById: (listId: string) => fetchJson<ListWithRole>(`/api/lists/${listId}`),

  create: (name: string) =>
    fetchJson<ListWithRole>("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  update: (
    listId: string,
    data: { name?: string; regenerateInviteCode?: boolean }
  ) =>
    fetchJson<ListWithRole>(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (listId: string) =>
    fetchJson<{ success: boolean }>(`/api/lists/${listId}`, {
      method: "DELETE",
    }),

  leave: (listId: string) =>
    fetchJson<{ success: boolean }>(`/api/lists/${listId}/leave`, {
      method: "POST",
    }),

  getMembers: (listId: string) =>
    fetchJson<Member[]>(`/api/lists/${listId}/members`),

  removeMember: (listId: string, userId: string) =>
    fetchJson<{ success: boolean }>(`/api/lists/${listId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }),

  updateMemberRole: (listId: string, userId: string, role: ListRole) =>
    fetchJson<{ success: boolean; role: ListRole }>(
      `/api/lists/${listId}/members`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      }
    ),

  getJoinInfo: (inviteCode: string) =>
    fetchJson<{ name: string }>(`/api/lists/join?inviteCode=${inviteCode}`),

  join: (inviteCode: string) =>
    fetchJson<ListWithRole>("/api/lists/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    }),
}

export const entryApi = {
  getAll: () => fetchJson<EntryWithList[]>("/api/entries"),

  getShared: () => fetchJson<ViewerEntry[]>("/api/entries/shared"),

  getByList: (listId: string) =>
    fetchJson<Entry[]>(`/api/lists/${listId}/entries`),

  create: (listId: string, data: EntryFormData) =>
    fetchJson<Entry>(`/api/lists/${listId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  update: (listId: string, entryId: string, data: Partial<Entry>) =>
    fetchJson<Entry>(`/api/lists/${listId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  delete: (listId: string, entryId: string) =>
    fetchJson<{ success: boolean }>(`/api/lists/${listId}/entries/${entryId}`, {
      method: "DELETE",
    }),

  addWatch: (listId: string, entryId: string, watchData: WatchFormData) =>
    fetchJson<Entry["watches"][number]>(
      `/api/lists/${listId}/entries/${entryId}/watches`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchData),
      }
    ),

  deleteWatch: (listId: string, entryId: string, watchId: string) =>
    fetchJson<{ success: boolean }>(
      `/api/lists/${listId}/entries/${entryId}/watches/${watchId}`,
      { method: "DELETE" }
    ),

  updateWatch: (
    listId: string,
    entryId: string,
    watchId: string,
    watchData: WatchFormData
  ) =>
    fetchJson<{ success: boolean }>(
      `/api/lists/${listId}/entries/${entryId}/watches/${watchId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(watchData),
      }
    ),

  updateRating: (listId: string, entryId: string, rating: UserRatingValue | null) =>
    fetchJson<Entry>(`/api/lists/${listId}/entries/${entryId}/rating`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    }),

  updateMedia: (
    listId: string,
    entryId: string,
    media: {
      tmdbId: number
      mediaType: "movie" | "tv"
      title: string
      originalTitle: string
      overview: string
      posterPath: string | null
      backdropPath: string | null
      releaseDate?: string
      firstAirDate?: string
      runtime?: number | null
      episodeRunTime?: number[]
      numberOfSeasons?: number
      numberOfEpisodes?: number
      genres: { id: number; name: string }[]
      voteAverage: number
      voteCount: number
      popularity: number
      status: string
      imdbId?: string | null
      originalLanguage: string
      networks?: { id: number; name: string; logoPath: string | null }[]
    }
  ) =>
    fetchJson<Entry>(`/api/lists/${listId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media }),
    }),
}

export const tmdbApi = {
  search: (query: string) =>
    fetchJson<{ results: TMDBSearchResult[] }>(
      `/api/tmdb/search?query=${encodeURIComponent(query)}`
    ),

  getDetails: (mediaType: string, id: number) =>
    fetchJson<TMDBMovieDetails | TMDBTVDetails>(`/api/tmdb/${mediaType}/${id}`),
}
