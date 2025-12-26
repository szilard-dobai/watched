import { requireAuth } from "@/lib/api/auth-helpers";
import { checkListAccess } from "@/lib/api/list-helpers";
import {
  getMembershipsCollection,
  getUserCollection,
} from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ listId: string }>;
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth();
    const { listId } = await params;

    const role = await checkListAccess(listId, session.user.id);
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const memberships = await getMembershipsCollection();
    const users = await getUserCollection();

    const listMemberships = await memberships
      .find({ listId: new ObjectId(listId) })
      .toArray();

    const userIds = listMemberships.map((m) => new ObjectId(m.userId));
    const memberUsers = await users.find({ _id: { $in: userIds } }).toArray();

    const members = listMemberships.map((membership) => {
      const user = memberUsers.find(
        (u) => u._id.toString() === membership.userId
      );
      return {
        _id: membership._id.toString(),
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        name: user?.name ?? "Unknown",
        email: user?.email ?? "",
      };
    });

    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
};

export const DELETE = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth();
    const { listId } = await params;
    const { userId: targetUserId } = await request.json();

    const role = await checkListAccess(listId, session.user.id);
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only owner can remove members" },
        { status: 403 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Owner cannot remove themselves" },
        { status: 400 }
      );
    }

    const memberships = await getMembershipsCollection();
    const result = await memberships.deleteOne({
      listId: new ObjectId(listId),
      userId: targetUserId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
};
