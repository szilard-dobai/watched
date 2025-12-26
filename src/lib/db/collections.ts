import type { Collection, Document } from "mongodb"
import getDb from "."

export const getListsCollection = async (): Promise<Collection<Document>> => {
  const db = await getDb()
  return db.collection("lists")
}

export const getMembershipsCollection = async (): Promise<
  Collection<Document>
> => {
  const db = await getDb()
  return db.collection("listMemberships")
}

export const getEntriesCollection = async (): Promise<Collection<Document>> => {
  const db = await getDb()
  return db.collection("entries")
}
