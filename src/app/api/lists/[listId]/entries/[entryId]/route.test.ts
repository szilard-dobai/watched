import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PATCH, DELETE } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const entryId = "507f1f77bcf86cd799439022"

const mockEntry = {
  _id: new ObjectId(entryId),
  listId: new ObjectId(listId),
  addedByUserId: "user-123",
  tmdbId: 550,
  mediaType: "movie",
  title: "Fight Club",
  originalTitle: "Fight Club",
  overview: "An insomniac office worker...",
  posterPath: "/poster.jpg",
  watches: [{ _id: "watch-1", startDate: "2024-01-01", addedByUserId: "user-123" }],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

vi.mock("@/lib/api/list-helpers", () => ({
  checkListAccess: vi.fn(),
  checkEntryPermission: vi.fn(),
}))

vi.mock("@/lib/db/collections", () => ({
  getEntriesCollection: vi.fn(),
}))

import { checkListAccess, checkEntryPermission } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"

const createParams = (lId: string, eId: string) => ({
  params: Promise.resolve({ listId: lId, entryId: eId }),
})

describe("/api/lists/[listId]/entries/[entryId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("GET", () => {
    it("returns entry details", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("Fight Club")
      expect(data._id).toBe(entryId)
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await GET(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 403 when user has no access", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await GET(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("PATCH", () => {
    it("updates entry successfully with permission", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")
      vi.mocked(checkEntryPermission).mockReturnValue(true)

      const updatedEntry = { ...mockEntry, title: "Updated Title" }
      const mockEntriesCollection = {
        findOne: vi.fn()
          .mockResolvedValueOnce(mockEntry)
          .mockResolvedValueOnce(updatedEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      })

      const response = await PATCH(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("Updated Title")
    })

    it("only updates allowed fields", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")
      vi.mocked(checkEntryPermission).mockReturnValue(true)

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Updated Title",
          tmdbId: 999,
          addedByUserId: "hacker",
          listId: "different-list",
        }),
      })

      await PATCH(request, createParams(listId, entryId))

      expect(mockEntriesCollection.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          $set: expect.objectContaining({
            title: "Updated Title",
            updatedAt: expect.any(String),
          }),
        })
      )

      const updateCall = mockEntriesCollection.updateOne.mock.calls[0][1].$set
      expect(updateCall.tmdbId).toBeUndefined()
      expect(updateCall.addedByUserId).toBeUndefined()
      expect(updateCall.listId).toBeUndefined()
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      })

      const response = await PATCH(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 403 when user lacks permission to edit", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")
      vi.mocked(checkEntryPermission).mockReturnValue(false)

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue({ ...mockEntry, addedByUserId: "other-user" }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      })

      const response = await PATCH(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Not authorized to edit this entry")
    })

    it("returns 403 when user has no access to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      })

      const response = await PATCH(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      })

      const response = await PATCH(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("DELETE", () => {
    it("deletes entry successfully with permission", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")
      vi.mocked(checkEntryPermission).mockReturnValue(true)

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockEntriesCollection.deleteOne).toHaveBeenCalled()
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 403 when user lacks permission to delete", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")
      vi.mocked(checkEntryPermission).mockReturnValue(false)

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue({ ...mockEntry, addedByUserId: "other-user" }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Not authorized to delete this entry")
    })

    it("returns 403 when user has no access to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await DELETE(new Request("http://localhost"), createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
