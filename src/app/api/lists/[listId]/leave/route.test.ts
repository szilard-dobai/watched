import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getMembershipsCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getMembershipsCollection } from "@/lib/db/collections"

const createParams = (id: string) => ({ params: Promise.resolve({ listId: id }) })

describe("/api/lists/[listId]/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("POST", () => {
    it("leaves list successfully as member", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockMembershipsCollection = {
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      }

      vi.mocked(getMembershipsCollection).mockResolvedValue(mockMembershipsCollection as never)

      const response = await POST(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockMembershipsCollection.deleteOne).toHaveBeenCalledWith({
        listId: new ObjectId(listId),
        userId: mockUserId,
      })
    })

    it("returns 400 when owner tries to leave", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const response = await POST(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Owner cannot leave the list. Delete it instead.")
    })

    it("returns 403 when not a member of the list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await POST(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Not a member of this list")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await POST(new Request("http://localhost"), createParams(listId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
