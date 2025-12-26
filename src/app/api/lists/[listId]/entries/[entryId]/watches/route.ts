import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"

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

    const { startDate, endDate, platform, notes } = await request.json()

    if (!startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
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

    const newWatch = {
      _id: watchId,
      startDate,
      endDate,
      platform,
      notes,
      addedByUserId: session.user.id,
      addedAt: now,
    }

    await entries.updateOne(
      { _id: new ObjectId(entryId) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $push: { watches: newWatch }, $set: { updatedAt: now } } as any
    )

    return NextResponse.json(newWatch, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
