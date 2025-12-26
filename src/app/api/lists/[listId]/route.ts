import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess, generateInviteCode } from "@/lib/api/list-helpers"
import { getListsCollection, getMembershipsCollection } from "@/lib/db/collections"

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

    const lists = await getListsCollection()
    const list = await lists.findOne({ _id: new ObjectId(listId) })

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    const memberships = await getMembershipsCollection()
    const memberCount = await memberships.countDocuments({
      listId: new ObjectId(listId),
    })

    return NextResponse.json({
      ...list,
      _id: list._id.toString(),
      role,
      memberCount,
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (role !== "owner") {
      return NextResponse.json({ error: "Only owner can update list" }, { status: 403 })
    }

    const { name, regenerateInviteCode } = await request.json()
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

    if (name && typeof name === "string" && name.trim().length > 0) {
      updates.name = name.trim()
    }

    if (regenerateInviteCode) {
      updates.inviteCode = generateInviteCode()
    }

    const lists = await getListsCollection()
    await lists.updateOne({ _id: new ObjectId(listId) }, { $set: updates })

    const updatedList = await lists.findOne({ _id: new ObjectId(listId) })

    return NextResponse.json({ ...updatedList, _id: updatedList?._id.toString() })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (role !== "owner") {
      return NextResponse.json({ error: "Only owner can delete list" }, { status: 403 })
    }

    const lists = await getListsCollection()
    const memberships = await getMembershipsCollection()

    await lists.deleteOne({ _id: new ObjectId(listId) })
    await memberships.deleteMany({ listId: new ObjectId(listId) })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
