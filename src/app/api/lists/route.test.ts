import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const mockMemberships = [
  { _id: new ObjectId(), userId: "user-123", listId: new ObjectId("507f1f77bcf86cd799439011"), role: "owner" },
  { _id: new ObjectId(), userId: "user-123", listId: new ObjectId("507f1f77bcf86cd799439012"), role: "member" },
]

const mockLists = [
  {
    _id: new ObjectId("507f1f77bcf86cd799439011"),
    name: "My Movies",
    ownerId: "user-123",
    inviteCode: "abc123",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId("507f1f77bcf86cd799439012"),
    name: "Shared List",
    ownerId: "other-user",
    inviteCode: "def456",
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
]

vi.mock("@/lib/api/list-helpers", () => ({
  generateInviteCode: vi.fn(() => "newinvite123"),
}))

vi.mock("@/lib/db/collections", () => ({
  getListsCollection: vi.fn(),
  getMembershipsCollection: vi.fn(),
}))

import { getListsCollection, getMembershipsCollection } from "@/lib/db/collections"

describe("/api/lists", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns user lists with roles and member counts", async () => {
      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
        aggregate: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { _id: mockMemberships[0].listId, count: 2 },
            { _id: mockMemberships[1].listId, count: 3 },
          ]),
        }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockLists) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe("My Movies")
      expect(data[0].role).toBe("owner")
      expect(data[0].memberCount).toBe(2)
      expect(data[1].name).toBe("Shared List")
      expect(data[1].role).toBe("member")
      expect(data[1].memberCount).toBe(3)
    })

    it("returns empty array when user has no lists", async () => {
      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      const mockListsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("POST", () => {
    it("creates a new list successfully", async () => {
      const insertedList = {
        _id: new ObjectId(),
        name: "New List",
        ownerId: "user-123",
        inviteCode: "newinvite123",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }

      const mockListsCollection = {
        insertOne: vi.fn().mockResolvedValue({ insertedId: insertedList._id }),
        findOne: vi.fn().mockResolvedValue(insertedList),
      }

      const mockMembershipsCollection = {
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe("New List")
      expect(data.role).toBe("owner")
      expect(data.memberCount).toBe(1)
      expect(mockListsCollection.insertOne).toHaveBeenCalled()
      expect(mockMembershipsCollection.insertOne).toHaveBeenCalled()
    })

    it("trims whitespace from list name", async () => {
      const mockListsCollection = {
        insertOne: vi.fn(),
        findOne: vi.fn().mockResolvedValue({
          _id: new ObjectId(),
          name: "Trimmed Name",
          ownerId: "user-123",
          inviteCode: "newinvite123",
        }),
      }

      const mockMembershipsCollection = {
        insertOne: vi.fn(),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "  Trimmed Name  " }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockListsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Trimmed Name" })
      )
    })

    it("returns 400 when name is missing", async () => {
      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("List name is required")
    })

    it("returns 400 when name is empty string", async () => {
      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("List name is required")
    })

    it("returns 400 when name is only whitespace", async () => {
      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("List name is required")
    })

    it("returns 400 when name is not a string", async () => {
      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("List name is required")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
