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

    const viewerMemberships = await memberships
      .find({ userId, role: "viewer" })
      .toArray()
    const viewerListIds = viewerMemberships.map((m) => m.listId)

    if (viewerListIds.length === 0) {
      return NextResponse.json([])
    }

    const viewerLists = await lists
      .find({ _id: { $in: viewerListIds } })
      .toArray()
    const listMap = new Map(viewerLists.map((l) => [l._id.toString(), l.name]))

    const sharedEntries = await entries
      .aggregate([
        { $match: { listId: { $in: viewerListIds } } },
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
            ownerRating: 1,
            createdAt: 1,
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

    const entriesWithListName = sharedEntries.map((entry) => {
      const entryData = entry as { listId: string }
      return {
        ...entry,
        listName: listMap.get(entryData.listId) ?? "Unknown List",
      }
    })

    entriesWithListName.sort((a, b) => {
      const aEntry = a as unknown as { createdAt: string }
      const bEntry = b as unknown as { createdAt: string }
      return (
        new Date(bEntry.createdAt).getTime() -
        new Date(aEntry.createdAt).getTime()
      )
    })

    return NextResponse.json(entriesWithListName)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
