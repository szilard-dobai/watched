import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const mediaId1 = new ObjectId()
const mediaId2 = new ObjectId()

const mockAggregatedEntries = [
  {
    _id: new ObjectId().toString(),
    listId: listId,
    mediaId: mediaId1.toString(),
    addedByUserId: mockUserId,
    tmdbId: 550,
    mediaType: "movie",
    title: "Fight Club",
    watches: [{ _id: "watch-1", startDate: "2024-01-01" }],
    watchStatus: "planned",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId().toString(),
    listId: listId,
    mediaId: mediaId2.toString(),
    addedByUserId: "user-456",
    tmdbId: 1399,
    mediaType: "tv",
    title: "Game of Thrones",
    watches: [{ _id: "watch-2", startDate: "2024-02-01" }],
    watchStatus: "planned",
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
  },
]

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getEntriesCollection: vi.fn(),
  getMediaCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection, getMediaCollection } from "@/lib/db/collections"

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
        aggregate: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockAggregatedEntries),
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
        aggregate: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
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
      watchStatus: "finished",
      startDate: "2024-03-01",
      endDate: "2024-03-01",
      platform: "Netflix",
      notes: "Great movie!",
    }

    it("creates a new entry successfully with new media", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockMediaCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      vi.mocked(getMediaCollection).mockResolvedValue(mockMediaCollection as never)
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
      expect(mockMediaCollection.insertOne).toHaveBeenCalled()
      expect(mockEntriesCollection.insertOne).toHaveBeenCalled()
    })

    it("reuses existing media when adding to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const existingMediaId = new ObjectId()
      const mockMediaCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: existingMediaId,
          tmdbId: 157336,
          mediaType: "movie",
          title: "Interstellar",
        }),
      }

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      vi.mocked(getMediaCollection).mockResolvedValue(mockMediaCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(newEntryData),
      })

      const response = await POST(request, createParams(listId))

      expect(response.status).toBe(201)
      expect(mockMediaCollection.findOne).toHaveBeenCalledWith({
        tmdbId: 157336,
        mediaType: "movie",
      })
    })

    it("adds watch to existing entry when entry already exists in list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const existingMediaId = new ObjectId()
      const existingEntryId = new ObjectId()
      const mockMediaCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: existingMediaId,
          tmdbId: 550,
          mediaType: "movie",
          title: "Fight Club",
          originalTitle: "Fight Club",
          overview: "An insomniac office worker...",
          posterPath: "/poster.jpg",
          backdropPath: "/backdrop.jpg",
          releaseDate: "1999-10-15",
          runtime: 139,
          genres: [{ id: 18, name: "Drama" }],
          voteAverage: 8.4,
          voteCount: 26000,
          popularity: 80,
          status: "Released",
          imdbId: "tt0137523",
          originalLanguage: "en",
        }),
      }

      const existingWatch = {
        _id: "existing-watch-id",
        startDate: "2024-01-01",
        endDate: "2024-01-01",
        platform: "HBO Max",
        notes: "First watch",
        addedByUserId: mockUserId,
        addedAt: "2024-01-01T00:00:00.000Z",
      }

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: existingEntryId,
          listId: new ObjectId(listId),
          mediaId: existingMediaId,
          addedByUserId: mockUserId,
          watchStatus: "finished",
          watches: [existingWatch],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getMediaCollection).mockResolvedValue(mockMediaCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          ...newEntryData,
          tmdbId: 550,
          watchStatus: "finished",
          startDate: "2024-03-15",
          endDate: "2024-03-15",
          platform: "Netflix",
          notes: "Second watch",
        }),
      })

      const response = await POST(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("Fight Club")
      expect(data.watches).toHaveLength(2)
      expect(data.watches[1].startDate).toBe("2024-03-15")
      expect(data.watches[1].platform).toBe("Netflix")
      expect(mockEntriesCollection.updateOne).toHaveBeenCalled()
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
