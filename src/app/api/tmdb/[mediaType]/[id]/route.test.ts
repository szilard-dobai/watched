import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "./route"
import { requireAuth } from "@/lib/api/auth-helpers"
import { mockSession } from "@/test/mocks/auth"

const originalEnv = process.env

const createParams = (mediaType: string, id: string) => ({
  params: Promise.resolve({ mediaType, id }),
})

describe("/api/tmdb/[mediaType]/[id]", () => {
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
    it("returns movie details from TMDB", async () => {
      const mockMovieData = {
        id: 550,
        title: "Fight Club",
        overview: "An insomniac office worker...",
        release_date: "1999-10-15",
        runtime: 139,
        genres: [{ id: 18, name: "Drama" }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMovieData),
      })

      const response = await GET(new Request("http://localhost"), createParams("movie", "550"))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("Fight Club")
      expect(data.id).toBe(550)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("movie/550")
      )
    })

    it("returns TV show details from TMDB", async () => {
      const mockTvData = {
        id: 1399,
        name: "Game of Thrones",
        overview: "Seven noble families fight...",
        first_air_date: "2011-04-17",
        number_of_seasons: 8,
        genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTvData),
      })

      const response = await GET(new Request("http://localhost"), createParams("tv", "1399"))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe("Game of Thrones")
      expect(data.id).toBe(1399)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("tv/1399")
      )
    })

    it("returns 400 for invalid media type", async () => {
      const response = await GET(new Request("http://localhost"), createParams("person", "123"))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid media type")
    })

    it("returns 500 when TMDB API key is not configured", async () => {
      delete process.env.TMDB_API_KEY

      const response = await GET(new Request("http://localhost"), createParams("movie", "550"))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("TMDB API key not configured")
    })

    it("returns error status when TMDB API returns 404", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const response = await GET(new Request("http://localhost"), createParams("movie", "999999999"))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Failed to fetch from TMDB")
    })

    it("returns error status when TMDB API returns 500", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const response = await GET(new Request("http://localhost"), createParams("movie", "550"))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to fetch from TMDB")
    })

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))

      const response = await GET(new Request("http://localhost"), createParams("movie", "550"))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
