import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PATCH, DELETE } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const mockList = {
  _id: new ObjectId(listId),
  name: "My Movies",
  ownerId: "user-123",
  inviteCode: "abc123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
  generateInviteCode: vi.fn(() => "newinvite456"),
}))

vi.mock("@/lib/db/collections", () => ({
  getListsCollection: vi.fn(),
  getMembershipsCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getListsCollection, getMembershipsCollection } from "@/lib/db/collections"

const createParams = (id: string) => ({ params: Promise.resolve({ listId: id }) })

describe("/api/lists/[listId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns list details for owner", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockListsCollection = {
        findOne: vi.fn().mockResolvedValue(mockList),
      }
      const mockMembershipsCollection = {
        countDocuments: vi.fn().mockResolvedValue(3),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe("My Movies")
      expect(data.role).toBe("owner")
      expect(data.memberCount).toBe(3)
      expect(data._id).toBe(listId)
    })

    it("returns list details for member", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockListsCollection = {
        findOne: vi.fn().mockResolvedValue(mockList),
      }
      const mockMembershipsCollection = {
        countDocuments: vi.fn().mockResolvedValue(5),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.role).toBe("member")
    })

    it("returns 403 when user has no access", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 404 when list not found", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockListsCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("List not found")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("PATCH", () => {
    it("updates list name successfully", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const updatedList = { ...mockList, name: "Updated Name" }
      const mockListsCollection = {
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        findOne: vi.fn().mockResolvedValue(updatedList),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Name" }),
      })

      const response = await PATCH(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe("Updated Name")
    })

    it("regenerates invite code when requested", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const updatedList = { ...mockList, inviteCode: "newinvite456" }
      const mockListsCollection = {
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        findOne: vi.fn().mockResolvedValue(updatedList),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ regenerateInviteCode: true }),
      })

      const response = await PATCH(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockListsCollection.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({ inviteCode: "newinvite456" }),
        })
      )
    })

    it("returns 403 when non-owner tries to update", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      })

      const response = await PATCH(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Only owner can update list")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      })

      const response = await PATCH(request, createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("DELETE", () => {
    it("deletes list and memberships successfully", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockListsCollection = {
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      }
      const mockMembershipsCollection = {
        deleteMany: vi.fn().mockResolvedValue({ deletedCount: 3 }),
      }

      vi.mocked(getListsCollection).mockResolvedValue(mockListsCollection as never)
      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockListsCollection.deleteOne).toHaveBeenCalled()
      expect(mockMembershipsCollection.deleteMany).toHaveBeenCalled()
    })

    it("returns 403 when non-owner tries to delete", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const response = await DELETE(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Only owner can delete list")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await DELETE(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
