import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const mockList = {
  _id: new ObjectId("507f1f77bcf86cd799439011"),
  name: "Shared Movies",
  ownerId: "other-user",
  inviteCode: "validcode123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

vi.mock("@/lib/api/list-helpers", () => ({
  getListByInviteCode: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getMembershipsCollection: vi.fn(),
}))

import { getListByInviteCode } from "@/lib/api/list-helpers"
import { getMembershipsCollection } from "@/lib/db/collections"

describe("/api/lists/join", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("POST", () => {
    it("joins list successfully with valid invite code", async () => {
      vi.mocked(getListByInviteCode).mockResolvedValue(mockList)

      const mockMembershipsCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "validcode123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe("Shared Movies")
      expect(data.role).toBe("viewer")
      expect(mockMembershipsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          listId: mockList._id,
          role: "viewer",
        })
      )
    })

    it("returns 400 when invite code is missing", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invite code is required")
    })

    it("returns 400 when invite code is not a string", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: 123 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invite code is required")
    })

    it("returns 404 when invite code is invalid", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(getListByInviteCode).mockResolvedValue(null)

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "invalidcode" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Invalid invite code")
    })

    it("returns 400 when user is already a member", async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockSession)
      vi.mocked(getListByInviteCode).mockResolvedValue(mockList)

      const mockMembershipsCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: new ObjectId(),
          userId: mockUserId,
          listId: mockList._id,
          role: "member",
        }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "validcode123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Already a member of this list")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost/api/lists/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "validcode123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
