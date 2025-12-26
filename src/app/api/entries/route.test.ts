import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const listId1 = new ObjectId("507f1f77bcf86cd799439011")
const listId2 = new ObjectId("507f1f77bcf86cd799439012")

const mockMemberships = [
  { _id: new ObjectId(), userId: "user-123", listId: listId1, role: "owner" },
  { _id: new ObjectId(), userId: "user-123", listId: listId2, role: "member" },
]

const mockLists = [
  { _id: listId1, name: "My Movies", ownerId: "user-123" },
  { _id: listId2, name: "Shared List", ownerId: "other-user" },
]

const mockEntries = [
  {
    _id: new ObjectId(),
    listId: listId1,
    addedByUserId: "user-123",
    tmdbId: 550,
    mediaType: "movie",
    title: "Fight Club",
    watches: [
      { _id: "watch-1", startDate: "2024-01-01", addedByUserId: "user-123", addedAt: "2024-01-01T00:00:00.000Z" },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId(),
    listId: listId2,
    addedByUserId: "user-456",
    tmdbId: 1399,
    mediaType: "tv",
    title: "Game of Thrones",
    watches: [
      { _id: "watch-2", startDate: "2024-02-01", addedByUserId: "user-456", addedAt: "2024-02-15T00:00:00.000Z" },
    ],
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-15T00:00:00.000Z",
  },
]

vi.mock("@/lib/db/collections", () => ({
  getMembershipsCollection: vi.fn(),
  getEntriesCollection: vi.fn(),
  getListsCollection: vi.fn(),
}))

import { getMembershipsCollection, getEntriesCollection, getListsCollection } from "@/lib/db/collections"

describe("/api/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns entries from all user lists sorted by latest watch", async () => {
      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockEntries) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockLists) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].title).toBe("Game of Thrones")
      expect(data[0].listName).toBe("Shared List")
      expect(data[1].title).toBe("Fight Club")
      expect(data[1].listName).toBe("My Movies")
    })

    it("returns entries sorted by createdAt when no watches", async () => {
      const entriesNoWatches = mockEntries.map((e) => ({ ...e, watches: [] }))

      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(entriesNoWatches) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockLists) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].title).toBe("Game of Thrones")
      expect(data[1].title).toBe("Fight Club")
    })

    it("returns empty array when user has no lists", async () => {
      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it("handles unknown list gracefully", async () => {
      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockEntriesCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockEntries) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([mockLists[0]]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      const entryWithUnknownList = data.find((e: { title: string }) => e.title === "Game of Thrones")
      expect(entryWithUnknownList.listName).toBe("Unknown List")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
