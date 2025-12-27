import { describe, it, expect } from "vitest"
import { generateInviteCode, checkEntryPermission } from "./list-helpers"
import type { Entry } from "@/types"

describe("list-helpers", () => {
  describe("generateInviteCode", () => {
    it("generates a 12-character code", () => {
      const code = generateInviteCode()
      expect(code).toHaveLength(12)
    })

    it("generates alphanumeric codes", () => {
      const code = generateInviteCode()
      expect(code).toMatch(/^[a-z0-9]+$/)
    })

    it("generates unique codes", () => {
      const codes = new Set<string>()
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode())
      }
      expect(codes.size).toBe(100)
    })
  })

  describe("checkEntryPermission", () => {
    const mockEntry: Entry = {
      _id: "entry-1",
      listId: "list-1",
      addedByUserId: "user-1",
      tmdbId: 550,
      mediaType: "movie",
      title: "Test Movie",
      originalTitle: "Test Movie",
      overview: "Test overview",
      posterPath: null,
      backdropPath: null,
      genres: [],
      voteAverage: 7.5,
      voteCount: 1000,
      popularity: 50,
      status: "Released",
      originalLanguage: "en",
      watchStatus: "finished",
      watches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it("returns true for owner regardless of who added", () => {
      const result = checkEntryPermission(mockEntry, "different-user", "owner")
      expect(result).toBe(true)
    })

    it("returns true for member who added the entry", () => {
      const result = checkEntryPermission(mockEntry, "user-1", "member")
      expect(result).toBe(true)
    })

    it("returns false for member who did not add the entry", () => {
      const result = checkEntryPermission(mockEntry, "different-user", "member")
      expect(result).toBe(false)
    })
  })
})
