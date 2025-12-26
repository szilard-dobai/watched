import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"
import type { Watch } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string; entryId: string; watchId: string }>
}

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId, watchId } = await params

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

    const watch = entry.watches?.find((w: Watch) => w._id === watchId)
    if (!watch) {
      return NextResponse.json({ error: "Watch not found" }, { status: 404 })
    }

    if (role !== "owner" && watch.addedByUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this watch" },
        { status: 403 }
      )
    }

    const { startDate, endDate, platform, notes } = await request.json()
    const now = new Date().toISOString()

    await entries.updateOne(
      { _id: new ObjectId(entryId), "watches._id": watchId },
      {
        $set: {
          "watches.$.startDate": startDate ?? watch.startDate,
          "watches.$.endDate": endDate,
          "watches.$.platform": platform,
          "watches.$.notes": notes,
          updatedAt: now,
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId, watchId } = await params

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

    const watch = entry.watches?.find((w: Watch) => w._id === watchId)
    if (!watch) {
      return NextResponse.json({ error: "Watch not found" }, { status: 404 })
    }

    if (role !== "owner" && watch.addedByUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this watch" },
        { status: 403 }
      )
    }

    if (entry.watches?.length === 1) {
      return NextResponse.json(
        { error: "Cannot delete the last watch. Delete the entry instead." },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    await entries.updateOne(
      { _id: new ObjectId(entryId) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $pull: { watches: { _id: watchId } }, $set: { updatedAt: now } } as any
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
