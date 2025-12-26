import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"

export const GET = async (request: NextRequest) => {
  try {
    await requireAuth()

    const query = request.nextUrl.searchParams.get("query")
    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from TMDB" },
        { status: response.status }
      )
    }

    const data = await response.json()

    const filtered = (data.results ?? []).filter(
      (r: { media_type: string }) =>
        r.media_type === "movie" || r.media_type === "tv"
    )

    return NextResponse.json({ results: filtered })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
