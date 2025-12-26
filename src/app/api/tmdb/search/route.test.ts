import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "./route"
import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const originalEnv = process.env

describe("/api/tmdb/search", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockSession)
    process.env = { ...originalEnv, TMDB_API_KEY: "test-api-key" }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe("GET", () => {
    it("returns search results from TMDB", async () => {
      const mockTmdbResponse = {
        results: [
          { id: 550, title: "Fight Club", media_type: "movie" },
          { id: 1399, name: "Game of Thrones", media_type: "tv" },
          { id: 123, name: "Some Person", media_type: "person" },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTmdbResponse),
      })

      const request = new NextRequest("http://localhost/api/tmdb/search?query=fight")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(2)
      expect(data.results[0].title).toBe("Fight Club")
      expect(data.results[1].name).toBe("Game of Thrones")
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search/multi")
      )
    })

    it("returns empty results when query is missing", async () => {
      const request = new NextRequest("http://localhost/api/tmdb/search")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toEqual([])
    })

    it("returns 500 when TMDB API key is not configured", async () => {
      delete process.env.TMDB_API_KEY

      const request = new NextRequest("http://localhost/api/tmdb/search?query=test")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("TMDB API key not configured")
    })

    it("returns error when TMDB API fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })

      const request = new NextRequest("http://localhost/api/tmdb/search?query=test")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe("Failed to fetch from TMDB")
    })

    it("encodes query parameter properly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })

      const request = new NextRequest("http://localhost/api/tmdb/search?query=the%20matrix")

      await GET(request)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query=the%20matrix")
      )
    })

    it("filters out non-movie/tv results", async () => {
      const mockTmdbResponse = {
        results: [
          { id: 1, media_type: "person" },
          { id: 2, media_type: "movie" },
          { id: 3, media_type: "collection" },
          { id: 4, media_type: "tv" },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTmdbResponse),
      })

      const request = new NextRequest("http://localhost/api/tmdb/search?query=test")

      const response = await GET(request)
      const data = await response.json()

      expect(data.results).toHaveLength(2)
      expect(data.results.every((r: { media_type: string }) => r.media_type === "movie" || r.media_type === "tv")).toBe(true)
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const request = new NextRequest("http://localhost/api/tmdb/search?query=test")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
