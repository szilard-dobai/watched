export const queryKeys = {
  lists: {
    all: ["lists"] as const,
    detail: (listId: string) => ["lists", listId] as const,
    members: (listId: string) => ["lists", listId, "members"] as const,
  },
  entries: {
    all: ["entries"] as const,
    shared: ["entries", "shared"] as const,
    byList: (listId: string) => ["entries", "list", listId] as const,
  },
  tmdb: {
    search: (query: string) => ["tmdb", "search", query] as const,
    details: (mediaType: string, id: number) =>
      ["tmdb", mediaType, id] as const,
  },
  join: {
    info: (inviteCode: string) => ["join", inviteCode] as const,
  },
}
