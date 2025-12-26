import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { generateInviteCode } from "@/lib/api/list-helpers"
import { getListsCollection, getMembershipsCollection } from "@/lib/db/collections"

export const GET = async () => {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const memberships = await getMembershipsCollection()
    const lists = await getListsCollection()

    const userMemberships = await memberships.find({ userId }).toArray()
    const listIds = userMemberships.map((m) => m.listId)

    const userLists = await lists
      .find({ _id: { $in: listIds } })
      .toArray()

    const membershipCounts = await memberships
      .aggregate([
        { $match: { listId: { $in: listIds } } },
        { $group: { _id: "$listId", count: { $sum: 1 } } },
      ])
      .toArray()

    const countMap = new Map(
      membershipCounts.map((c) => [c._id.toString(), c.count])
    )

    const listsWithRole = userLists.map((list) => {
      const membership = userMemberships.find(
        (m) => m.listId.toString() === list._id.toString()
      )
      return {
        ...list,
        _id: list._id.toString(),
        role: membership?.role ?? "member",
        memberCount: countMap.get(list._id.toString()) ?? 1,
      }
    })

    return NextResponse.json(listsWithRole)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const POST = async (request: Request) => {
  try {
    const session = await requireAuth()
    const userId = session.user.id
    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "List name is required" },
        { status: 400 }
      )
    }

    const lists = await getListsCollection()
    const memberships = await getMembershipsCollection()

    const now = new Date().toISOString()
    const listId = new ObjectId()

    await lists.insertOne({
      _id: listId,
      name: name.trim(),
      ownerId: userId,
      inviteCode: generateInviteCode(),
      createdAt: now,
      updatedAt: now,
    })

    await memberships.insertOne({
      _id: new ObjectId(),
      userId,
      listId,
      role: "owner",
      joinedAt: now,
    })

    const newList = await lists.findOne({ _id: listId })

    return NextResponse.json(
      { ...newList, _id: newList?._id.toString(), role: "owner", memberCount: 1 },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
