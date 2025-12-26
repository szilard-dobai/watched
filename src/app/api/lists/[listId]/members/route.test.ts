import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, DELETE } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const userId1 = mockUserId
const userId2 = "507f1f77bcf86cd799439022"

const mockMemberships = [
  {
    _id: new ObjectId(),
    userId: userId1,
    listId: new ObjectId(listId),
    role: "owner",
    joinedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    _id: new ObjectId(),
    userId: userId2,
    listId: new ObjectId(listId),
    role: "member",
    joinedAt: "2024-01-02T00:00:00.000Z",
  },
]

const mockUsers = [
  { _id: new ObjectId(userId1), name: "Test User", email: "test@example.com" },
  { _id: new ObjectId(userId2), name: "Other User", email: "other@example.com" },
]

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getMembershipsCollection: vi.fn(),
  getUserCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getMembershipsCollection, getUserCollection } from "@/lib/db/collections"

const createParams = (id: string) => ({ params: Promise.resolve({ listId: id }) })

describe("/api/lists/[listId]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns members with user info", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockUsersCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockUsers) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(mockUsersCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe("Test User")
      expect(data[0].role).toBe("owner")
      expect(data[1].name).toBe("Other User")
      expect(data[1].role).toBe("member")
    })

    it("returns member access as member", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockUsersCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockUsers) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(mockUsersCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))

      expect(response.status).toBe(200)
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

    it("handles unknown users gracefully", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockMembershipsCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockMemberships) }),
      }

      const mockUsersCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([mockUsers[0]]) }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)
      vi.mocked(getUserCollection).mockResolvedValue(mockUsersCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[1].name).toBe("Unknown")
      expect(data[1].email).toBe("")
    })
  })

  describe("DELETE", () => {
    it("removes member successfully as owner", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockMembershipsCollection = {
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ userId: userId2 }),
      })

      const response = await DELETE(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockMembershipsCollection.deleteOne).toHaveBeenCalledWith({
        listId: new ObjectId(listId),
        userId: userId2,
      })
    })

    it("returns 403 when member tries to remove another member", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const request = new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ userId: userId2 }),
      })

      const response = await DELETE(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Only owner can remove members")
    })

    it("returns 400 when owner tries to remove themselves", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const request = new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ userId: userId1 }),
      })

      const response = await DELETE(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Owner cannot remove themselves")
    })

    it("returns 404 when member not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockMembershipsCollection = {
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ userId: "nonexistent-user" }),
      })

      const response = await DELETE(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Member not found")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ userId: userId2 }),
      })

      const response = await DELETE(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
