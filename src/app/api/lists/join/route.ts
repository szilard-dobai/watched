import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/api/auth-helpers";
import { getListByInviteCode } from "@/lib/api/list-helpers";
import { getMembershipsCollection } from "@/lib/db/collections";

export const GET = async (request: NextRequest) => {
  try {
    await requireAuth();
    const inviteCode = request.nextUrl.searchParams.get("inviteCode");

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const list = await getListByInviteCode(inviteCode);
    if (!list) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...list,
      _id: list._id.toString(),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
};

export const POST = async (request: Request) => {
  try {
    const session = await requireAuth();
    const { inviteCode } = await request.json();

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const list = await getListByInviteCode(inviteCode);
    if (!list) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    const memberships = await getMembershipsCollection();
    const existingMembership = await memberships.findOne({
      listId: list._id,
      userId: session.user.id,
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this list" },
        { status: 400 }
      );
    }

    await memberships.insertOne({
      _id: new ObjectId(),
      userId: session.user.id,
      listId: list._id,
      role: "viewer",
      joinedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ...list,
      _id: list._id.toString(),
      role: "viewer",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
};
