import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getMembershipsCollection } from "@/lib/db/collections"

interface RouteParams {
  params: Promise<{ listId: string }>
}

export const POST = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Not a member of this list" }, { status: 403 })
    }

    if (role === "owner") {
      return NextResponse.json(
        { error: "Owner cannot leave the list. Delete it instead." },
        { status: 400 }
      )
    }

    const memberships = await getMembershipsCollection()
    await memberships.deleteOne({
      listId: new ObjectId(listId),
      userId: session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
