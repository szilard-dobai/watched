import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess, checkEntryPermission } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"
import type { Entry } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string; entryId: string }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ ...entry, _id: entry._id.toString() })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (!checkEntryPermission(entry as unknown as Entry, session.user.id, role)) {
      return NextResponse.json(
        { error: "Not authorized to edit this entry" },
        { status: 403 }
      )
    }

    const updates = await request.json()
    const allowedFields = [
      "title",
      "originalTitle",
      "overview",
      "posterPath",
      "backdropPath",
      "releaseDate",
      "firstAirDate",
      "runtime",
      "episodeRunTime",
      "numberOfSeasons",
      "numberOfEpisodes",
      "genres",
      "voteAverage",
      "voteCount",
      "popularity",
      "status",
      "imdbId",
      "originalLanguage",
      "networks",
    ]

    const filteredUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    await entries.updateOne({ _id: new ObjectId(entryId) }, { $set: filteredUpdates })

    const updatedEntry = await entries.findOne({ _id: new ObjectId(entryId) })
    return NextResponse.json({ ...updatedEntry, _id: updatedEntry?._id.toString() })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (!checkEntryPermission(entry as unknown as Entry, session.user.id, role)) {
      return NextResponse.json(
        { error: "Not authorized to delete this entry" },
        { status: 403 }
      )
    }

    await entries.deleteOne({ _id: new ObjectId(entryId) })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
