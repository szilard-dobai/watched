import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"

const mockEntries = [
  {
    _id: new ObjectId(),
    listId: new ObjectId(listId),
    addedByUserId: "user-123",
    tmdbId: 550,
    mediaType: "movie",
    title: "Fight Club",
    watches: [{ _id: "watch-1", startDate: "2024-01-01" }],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId(),
    listId: new ObjectId(listId),
    addedByUserId: "user-456",
    tmdbId: 1399,
    mediaType: "tv",
    title: "Game of Thrones",
    watches: [{ _id: "watch-2", startDate: "2024-02-01" }],
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
  },
]

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getEntriesCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"

const createParams = (id: string) => ({ params: Promise.resolve({ listId: id }) })

describe("/api/lists/[listId]/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns entries for the list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockEntries),
          }),
        }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].title).toBe("Fight Club")
      expect(data[1].title).toBe("Game of Thrones")
    })

    it("returns empty array when no entries", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it("returns 403 when user has no access", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("POST", () => {
    const newEntryData = {
      tmdbId: 157336,
      mediaType: "movie",
      title: "Interstellar",
      originalTitle: "Interstellar",
      overview: "A team of explorers travel through a wormhole in space.",
      posterPath: "/poster.jpg",
      backdropPath: "/backdrop.jpg",
      releaseDate: "2014-11-07",
      runtime: 169,
      genres: [{ id: 18, name: "Drama" }],
      voteAverage: 8.6,
      voteCount: 32000,
      popularity: 100,
      status: "Released",
      imdbId: "tt0816692",
      originalLanguage: "en",
      startDate: "2024-03-01",
      endDate: "2024-03-01",
      platform: "Netflix",
      notes: "Great movie!",
    }

    it("creates a new entry successfully", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(newEntryData),
      })

      const response = await POST(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe("Interstellar")
      expect(data.tmdbId).toBe(157336)
      expect(data.watches).toHaveLength(1)
      expect(data.watches[0].startDate).toBe("2024-03-01")
      expect(data.watches[0].platform).toBe("Netflix")
      expect(mockEntriesCollection.insertOne).toHaveBeenCalled()
    })

    it("returns 400 when entry already exists in list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntries[0]),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ ...newEntryData, tmdbId: 550 }),
      })

      const response = await POST(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Entry already exists in this list")
    })

    it("returns 403 when user has no access", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(newEntryData),
      })

      const response = await POST(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(newEntryData),
      })

      const response = await POST(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
