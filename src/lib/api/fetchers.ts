import type {
  ListWithRole,
  Entry,
  EntryFormData,
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  ListRole,
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

  addWatch: (
    listId: string,
    entryId: string,
    watchData: {
      startDate: string
      endDate?: string
      platform?: string
      notes?: string
    }
  ) =>
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
}

export const tmdbApi = {
  search: (query: string) =>
    fetchJson<{ results: TMDBSearchResult[] }>(
      `/api/tmdb/search?query=${encodeURIComponent(query)}`
    ),

  getDetails: (mediaType: string, id: number) =>
    fetchJson<TMDBMovieDetails | TMDBTVDetails>(`/api/tmdb/${mediaType}/${id}`),
}
