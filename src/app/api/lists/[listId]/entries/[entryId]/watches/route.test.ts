import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "./route"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession, mockUserId } from "@/test/mocks/auth"

const listId = "507f1f77bcf86cd799439011"
const entryId = "507f1f77bcf86cd799439022"

const mockEntry = {
  _id: new ObjectId(entryId),
  listId: new ObjectId(listId),
  addedByUserId: mockUserId,
  tmdbId: 550,
  mediaType: "movie",
  title: "Fight Club",
  watches: [{ _id: "watch-1", startDate: "2024-01-01", addedByUserId: mockUserId }],
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

const createParams = (lId: string, eId: string) => ({
  params: Promise.resolve({ listId: lId, entryId: eId }),
})

describe("/api/lists/[listId]/entries/[entryId]/watches", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
  })

  describe("POST", () => {
    it("adds a new watch successfully", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          status: "finished",
          startDate: "2024-02-01",
          endDate: "2024-02-01",
          platform: "Netflix",
          notes: "Rewatch",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe("finished")
      expect(data.startDate).toBe("2024-02-01")
      expect(data.platform).toBe("Netflix")
      expect(data.notes).toBe("Rewatch")
      expect(data.addedByUserId).toBe(mockUserId)
      expect(data._id).toBeDefined()
    })

    it("adds watch with only required fields", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("owner")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(mockEntry),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          status: "in_progress",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe("in_progress")
    })

    it("returns 400 when status is missing", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2024-02-01",
          platform: "Netflix",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Status is required")
    })

    it("returns 404 when entry not found", async () => {
      vi.mocked(checkListAccess).mockResolvedValue("member")

      const mockEntriesCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      }

      vi.mocked(getEntriesCollection).mockResolvedValue(mockEntriesCollection as never)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          status: "finished",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Entry not found")
    })

    it("returns 403 when user has no access to list", async () => {
      vi.mocked(checkListAccess).mockResolvedValue(null)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          status: "finished",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Access denied")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          status: "finished",
        }),
      })

      const response = await POST(request, createParams(listId, entryId))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
