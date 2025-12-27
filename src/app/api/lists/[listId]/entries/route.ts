import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"
import type { EntryFormData } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()
    const listEntries = await entries
      .find({ listId: new ObjectId(listId) })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(
      listEntries.map((e) => ({
        ...e,
        _id: e._id.toString(),
        watchStatus: e.watchStatus ?? "planned",
      }))
    )
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const data: EntryFormData = await request.json()

    const entries = await getEntriesCollection()

    const existingEntry = await entries.findOne({
      listId: new ObjectId(listId),
      tmdbId: data.tmdbId,
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: "Entry already exists in this list" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const entryId = new ObjectId()

    const entry = {
      _id: entryId,
      listId: new ObjectId(listId),
      addedByUserId: session.user.id,
      tmdbId: data.tmdbId,
      mediaType: data.mediaType,
      title: data.title,
      originalTitle: data.originalTitle,
      overview: data.overview,
      posterPath: data.posterPath,
      backdropPath: data.backdropPath,
      releaseDate: data.releaseDate,
      firstAirDate: data.firstAirDate,
      runtime: data.runtime,
      episodeRunTime: data.episodeRunTime,
      numberOfSeasons: data.numberOfSeasons,
      numberOfEpisodes: data.numberOfEpisodes,
      genres: data.genres,
      voteAverage: data.voteAverage,
      voteCount: data.voteCount,
      popularity: data.popularity,
      status: data.status,
      imdbId: data.imdbId,
      originalLanguage: data.originalLanguage,
      networks: data.networks,
      watchStatus: data.watchStatus,
      watches: [
        {
          _id: new ObjectId().toString(),
          startDate: data.startDate,
          endDate: data.endDate,
          platform: data.platform,
          notes: data.notes,
          addedByUserId: session.user.id,
          addedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    await entries.insertOne(entry)

    return NextResponse.json(
      { ...entry, _id: entryId.toString() },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
