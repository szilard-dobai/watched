import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-helpers"
import {
  getMembershipsCollection,
  getEntriesCollection,
  getListsCollection,
} from "@/lib/db/collections"

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
    const listMap = new Map(userLists.map((l) => [l._id.toString(), l.name]))

    const allEntries = await entries
      .aggregate([
        { $match: { listId: { $in: listIds } } },
        {
          $lookup: {
            from: "media",
            localField: "mediaId",
            foreignField: "_id",
            as: "media",
          },
        },
        { $unwind: "$media" },
        {
          $project: {
            _id: { $toString: "$_id" },
            listId: { $toString: "$listId" },
            mediaId: { $toString: "$mediaId" },
            addedByUserId: 1,
            watchStatus: { $ifNull: ["$watchStatus", "planned"] },
            watches: 1,
            createdAt: 1,
            updatedAt: 1,
            tmdbId: "$media.tmdbId",
            mediaType: "$media.mediaType",
            title: "$media.title",
            originalTitle: "$media.originalTitle",
            overview: "$media.overview",
            posterPath: "$media.posterPath",
            backdropPath: "$media.backdropPath",
            releaseDate: "$media.releaseDate",
            firstAirDate: "$media.firstAirDate",
            runtime: "$media.runtime",
            episodeRunTime: "$media.episodeRunTime",
            numberOfSeasons: "$media.numberOfSeasons",
            numberOfEpisodes: "$media.numberOfEpisodes",
            genres: "$media.genres",
            voteAverage: "$media.voteAverage",
            voteCount: "$media.voteCount",
            popularity: "$media.popularity",
            status: "$media.status",
            imdbId: "$media.imdbId",
            originalLanguage: "$media.originalLanguage",
            networks: "$media.networks",
          },
        },
      ])
      .toArray()

    const entriesWithListInfo = allEntries.map((entry) => {
      const entryData = entry as {
        listId: string
        watches?: { addedAt: string }[]
        createdAt: string
      }
      return {
        ...entry,
        listName: listMap.get(entryData.listId) ?? "Unknown List",
      }
    })

    entriesWithListInfo.sort((a, b) => {
      const aEntry = a as unknown as {
        watches?: { addedAt: string }[]
        createdAt: string
      }
      const bEntry = b as unknown as {
        watches?: { addedAt: string }[]
        createdAt: string
      }
      const aWatches = aEntry.watches ?? []
      const bWatches = bEntry.watches ?? []
      const aLatestWatch = aWatches.length
        ? Math.max(...aWatches.map((w) => new Date(w.addedAt).getTime()))
        : new Date(aEntry.createdAt).getTime()
      const bLatestWatch = bWatches.length
        ? Math.max(...bWatches.map((w) => new Date(w.addedAt).getTime()))
        : new Date(bEntry.createdAt).getTime()
      return bLatestWatch - aLatestWatch
    })

    return NextResponse.json(entriesWithListInfo)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
