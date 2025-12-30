import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const listId1 = new ObjectId("507f1f77bcf86cd799439011")
const listId2 = new ObjectId("507f1f77bcf86cd799439012")

const mockMemberships = [
  { _id: new ObjectId(), userId: mockUserId, listId: listId1, role: "owner" },
  { _id: new ObjectId(), userId: mockUserId, listId: listId2, role: "member" },
]

const mockLists = [
  { _id: listId1, name: "My Movies", ownerId: mockUserId },
  { _id: listId2, name: "Shared List", ownerId: "other-user" },
]

const mockAggregatedEntries = [
  {
    _id: new ObjectId().toString(),
    listId: listId1.toString(),
    mediaId: new ObjectId().toString(),
    addedByUserId: mockUserId,
    tmdbId: 550,
    mediaType: "movie",
    title: "Fight Club",
    watches: [
      { _id: "watch-1", startDate: "2024-01-01", addedByUserId: mockUserId, addedAt: "2024-01-01T00:00:00.000Z" },
    ],
    watchStatus: "planned",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId().toString(),
    listId: listId2.toString(),
    mediaId: new ObjectId().toString(),
    addedByUserId: "user-456",
    tmdbId: 1399,
    mediaType: "tv",
    title: "Game of Thrones",
    watches: [
      { _id: "watch-2", startDate: "2024-02-01", addedByUserId: "user-456", addedAt: "2024-02-15T00:00:00.000Z" },
    ],
    watchStatus: "planned",
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-15T00:00:00.000Z",
  },
]

vi.mock("@/lib/db/collections", () => ({
  getMembershipsCollection: vi.fn(),
  getEntriesCollection: vi.fn(),
  getListsCollection: vi.fn(),
  getUserCollection: vi.fn(),
}))

import { getMembershipsCollection, getEntriesCollection, getListsCollection, getUserCollection } from "@/lib/db/collections"

const mockUsers = [
  { _id: new ObjectId(mockUserId), name: "Test User", email: "test@test.com" },
  { _id: new ObjectId("507f1f77bcf86cd799439999"), name: "Other User", email: "other@test.com" },
]

const createMockUsersCollection = () => ({
  find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockUsers) }),
})

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
        aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockAggregatedEntries) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockLists) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(createMockUsersCollection() as never)

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
      const entriesNoWatches = mockAggregatedEntries.map((e) => ({ ...e, watches: [] }))

      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockEntriesCollection = {
        aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(entriesNoWatches) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockLists) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(createMockUsersCollection() as never)

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
        aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(createMockUsersCollection() as never)

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
        aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockAggregatedEntries) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([mockLists[0]]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(createMockUsersCollection() as never)

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
