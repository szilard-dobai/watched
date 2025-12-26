import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"
import { getMembershipsCollection, getEntriesCollection, getListsCollection } from "@/lib/db/collections"
import type { Watch } from "@/types"

export const GET = async () => {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const memberships = await getMembershipsCollection()
    const entries = await getEntriesCollection()
    const lists = await getListsCollection()

    const userMemberships = await memberships.find({ userId }).toArray()
    const listIds = userMemberships.map((m) => m.listId)

    const userLists = await lists.find({ _id: { $in: listIds } }).toArray()
    const listMap = new Map(userLists.map((l) => [l._id.toString(), l]))

    const allEntries = await entries
      .find({ listId: { $in: listIds } })
      .toArray()

    const entriesWithListInfo = allEntries.map((entry) => {
      const list = listMap.get(entry.listId.toString())
      const watches = (entry.watches ?? []) as Watch[]
      const createdAt = entry.createdAt as string
      return {
        ...entry,
        _id: entry._id.toString(),
        listId: entry.listId.toString(),
        listName: list?.name ?? "Unknown List",
        watches,
        createdAt,
      }
    })

    entriesWithListInfo.sort((a, b) => {
      const aLatestWatch = a.watches.length
        ? Math.max(...a.watches.map((w) => new Date(w.addedAt).getTime()))
        : new Date(a.createdAt).getTime()
      const bLatestWatch = b.watches.length
        ? Math.max(...b.watches.map((w) => new Date(w.addedAt).getTime()))
        : new Date(b.createdAt).getTime()
      return bLatestWatch - aLatestWatch
    })

    return NextResponse.json(entriesWithListInfo)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
