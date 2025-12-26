import { ObjectId } from "mongodb"
import {
  getListsCollection,
  getMembershipsCollection,
} from "@/lib/db/collections"
import type { Entry, ListRole } from "@/types"

export const generateInviteCode = (): string => {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12)
}

export const checkListAccess = async (
  listId: string,
  userId: string
): Promise<ListRole | null> => {
  const memberships = await getMembershipsCollection()
  const membership = await memberships.findOne({
    listId: new ObjectId(listId),
    userId,
  })
  return membership?.role ?? null
}

export const checkEntryPermission = (
  entry: Entry,
  userId: string,
  listRole: ListRole
): boolean => {
  if (listRole === "owner") return true
  return entry.addedByUserId === userId
}

export const getListByInviteCode = async (inviteCode: string) => {
  const lists = await getListsCollection()
  return lists.findOne({ inviteCode })
}

export const isListOwner = async (
  listId: string,
  userId: string
): Promise<boolean> => {
  const lists = await getListsCollection()
  const list = await lists.findOne({ _id: new ObjectId(listId) })
  return list?.ownerId === userId
}
