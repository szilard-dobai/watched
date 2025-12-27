import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"
import { computeEntryMeta } from "@/lib/entry-meta"
import type { DbWatch } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string; entryId: string }>
}

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { status, startDate, endDate, platform, notes } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const now = new Date().toISOString()
    const watchId = new ObjectId().toString()

    const newWatch: DbWatch = {
      _id: watchId,
      status,
      startDate,
      endDate,
      platform,
      notes,
      addedByUserId: session.user.id,
      addedAt: now,
    }

    const updatedWatches: DbWatch[] = [...entry.watches, newWatch]
    const meta = computeEntryMeta(updatedWatches)

    await entries.updateOne(
      { _id: new ObjectId(entryId) },
      { $push: { watches: newWatch }, $set: { updatedAt: now, ...meta } }
    )

    return NextResponse.json(newWatch, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
