import type { Collection } from "mongodb";
import type { User, DbList, DbListMembership, DbEntry } from "@/types";
import getDb from ".";

export const getListsCollection = async (): Promise<Collection<DbList>> => {
  const db = await getDb();
  return db.collection<DbList>("lists");
};

export const getMembershipsCollection = async (): Promise<
  Collection<DbListMembership>
> => {
  const db = await getDb();
  return db.collection<DbListMembership>("listMemberships");
};

export const getUserCollection = async (): Promise<Collection<User>> => {
  const db = await getDb();
  return db.collection<User>("user");
};

export const getEntriesCollection = async (): Promise<Collection<DbEntry>> => {
  const db = await getDb();
  return db.collection<DbEntry>("entries");
};
