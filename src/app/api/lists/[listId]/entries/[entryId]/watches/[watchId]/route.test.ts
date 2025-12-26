import { describe, it, expect, vi, beforeEach } from "vitest"
import { PATCH, DELETE } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const entryId = "507f1f77bcf86cd799439022"
const watchId = "watch-1"

const mockEntry = {
  _id: new ObjectId(entryId),
  listId: new ObjectId(listId),
  addedByUserId: "user-123",
  tmdbId: 550,
  mediaType: "movie",
  title: "Fight Club",
  watches: [
    { _id: watchId, startDate: "2024-01-01", addedByUserId: "user-123", addedAt: "2024-01-01T00:00:00.000Z" },
    { _id: "watch-2", startDate: "2024-02-01", addedByUserId: "user-456", addedAt: "2024-02-01T00:00:00.000Z" },
  ],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getEntriesCollection: vi.fn(),
}))

import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"

const createParams = (lId: string, eId: string, wId: string) => ({
  params: Promise.resolve({ listId: lId, entryId: eId, watchId: wId }),
})

describe("/api/lists/[listId]/entries/[entryId]/watches/[watchId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("PATCH", () => {
    it("updates watch successfully as the creator", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          startDate: "2024-01-15",
          endDate: "2024-01-15",
          platform: "Netflix",
          notes: "Updated note",
        }),
      })

      const response = await PATCH(request, createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("updates watch successfully as owner even if not creator", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          platform: "Disney+",
        }),
      })

      const response = await PATCH(request, createParams(listId, entryId, "watch-2"))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("returns 403 when member tries to edit another member's watch", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          platform: "Disney+",
        }),
      })

      const response = await PATCH(request, createParams(listId, entryId, "watch-2"))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Not authorized to edit this watch")
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ platform: "Netflix" }),
      })

      const response = await PATCH(request, createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 404 when watch not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ platform: "Netflix" }),
      })

      const response = await PATCH(request, createParams(listId, entryId, "nonexistent-watch"))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Watch not found")
    })

    it("returns 403 when user has no access to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ platform: "Netflix" }),
      })

      const response = await PATCH(request, createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ platform: "Netflix" }),
      })

      const response = await PATCH(request, createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("DELETE", () => {
    it("deletes watch successfully as the creator", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("deletes watch successfully as owner even if not creator", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, "watch-2"))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it("returns 400 when trying to delete the last watch", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const entryWithOneWatch = {
        ...mockEntry,
        watches: [{ _id: watchId, startDate: "2024-01-01", addedByUserId: "user-123" }],
      }

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(entryWithOneWatch),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Cannot delete the last watch. Delete the entry instead.")
    })

    it("returns 403 when member tries to delete another member's watch", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, "watch-2"))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Not authorized to delete this watch")
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 404 when watch not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, "nonexistent-watch"))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Watch not found")
    })

    it("returns 403 when user has no access to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId, watchId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
