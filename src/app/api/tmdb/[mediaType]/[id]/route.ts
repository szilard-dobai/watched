import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"

interface RouteParams {
  params: Promise<{ mediaType: string; id: string }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    await requireAuth()
    const { mediaType, id } = await params

    if (mediaType !== "movie" && mediaType !== "tv") {
      return NextResponse.json(
        { error: "Invalid media type" },
        { status: 400 }
      )
    }

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from TMDB" },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
