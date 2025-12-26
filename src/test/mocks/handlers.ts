import { http, HttpResponse } from "msw"
import type { ListWithRole, Entry } from "@/types"

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockSession = {
  user: mockUser,
  session: {
    id: "session-123",
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
}

export const mockLists: ListWithRole[] = [
  {
    _id: "list-1",
    name: "Family Movies",
    ownerId: mockUser.id,
    inviteCode: "abc123def456",
    role: "owner",
    memberCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "list-2",
    name: "Friends TV Shows",
    ownerId: "other-user",
    inviteCode: "xyz789ghi012",
    role: "member",
    memberCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const mockEntries: Entry[] = [
  {
    _id: "entry-1",
    listId: "list-1",
    addedByUserId: mockUser.id,
    tmdbId: 550,
    mediaType: "movie",
    title: "Fight Club",
    originalTitle: "Fight Club",
    overview: "A ticking-Loss timebomb of a movie about an insomniac office worker...",
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdropPath: "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
    releaseDate: "1999-10-15",
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }],
    voteAverage: 8.4,
    voteCount: 29696,
    popularity: 39.996,
    status: "Released",
    imdbId: "tt0137523",
    originalLanguage: "en",
    watches: [
      {
        _id: "watch-1",
        startDate: "2024-01-15",
        endDate: "2024-01-15",
        platform: "Netflix",
        notes: "First watch",
        addedByUserId: mockUser.id,
        addedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "entry-2",
    listId: "list-2",
    addedByUserId: "other-user",
    tmdbId: 1396,
    mediaType: "tv",
    title: "Breaking Bad",
    originalTitle: "Breaking Bad",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer...",
    posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    firstAirDate: "2008-01-20",
    episodeRunTime: [45, 47],
    numberOfSeasons: 5,
    numberOfEpisodes: 62,
    genres: [{ id: 18, name: "Drama" }, { id: 80, name: "Crime" }],
    voteAverage: 8.9,
    voteCount: 12500,
    popularity: 150.5,
    status: "Ended",
    originalLanguage: "en",
    networks: [{ id: 174, name: "AMC", logoPath: "/pmvRmATOCaDykE6JrVoeYZlMnKQ.png" }],
    watches: [
      {
        _id: "watch-2",
        startDate: "2024-02-01",
        endDate: "2024-03-15",
        platform: "Netflix",
        addedByUserId: "other-user",
        addedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json(mockSession)
  }),

  http.get("/api/lists", () => {
    return HttpResponse.json(mockLists)
  }),

  http.post("/api/lists", async ({ request }) => {
    const body = await request.json() as { name: string }
    const newList: ListWithRole = {
      _id: `list-${Date.now()}`,
      name: body.name,
      ownerId: mockUser.id,
      inviteCode: Math.random().toString(36).slice(2, 14),
      role: "owner",
      memberCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(newList, { status: 201 })
  }),

  http.get("/api/lists/:listId", ({ params }) => {
    const list = mockLists.find((l) => l._id === params.listId)
    if (!list) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 })
    }
    return HttpResponse.json(list)
  }),

  http.get("/api/lists/:listId/entries", ({ params }) => {
    const entries = mockEntries.filter((e) => e.listId === params.listId)
    return HttpResponse.json(entries)
  }),

  http.get("/api/entries", () => {
    const entriesWithListInfo = mockEntries.map((entry) => {
      const list = mockLists.find((l) => l._id === entry.listId)
      return { ...entry, listName: list?.name ?? "Unknown" }
    })
    return HttpResponse.json(entriesWithListInfo)
  }),

  http.get("/api/tmdb/search", ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get("query")
    if (!query) {
      return HttpResponse.json({ results: [] })
    }
    return HttpResponse.json({
      results: [
        {
          id: 550,
          title: "Fight Club",
          overview: "A movie about...",
          poster_path: "/poster.jpg",
          backdrop_path: "/backdrop.jpg",
          vote_average: 8.4,
          vote_count: 29696,
          popularity: 39.996,
          release_date: "1999-10-15",
          genre_ids: [18],
          media_type: "movie",
          original_language: "en",
          original_title: "Fight Club",
        },
      ],
    })
  }),
]
