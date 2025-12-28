import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection } from "@/lib/db/collections"
import type { UserRatingValue } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string; entryId: string }>
}

interface RatingBody {
  rating: UserRatingValue | null
}

export const PUT = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { rating }: RatingBody = await request.json()

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const now = new Date().toISOString()
    const userId = session.user.id

    if (rating === null) {
      await entries.updateOne(
        { _id: new ObjectId(entryId) },
        {
          $pull: { userRatings: { userId } },
          $set: { updatedAt: now },
        }
      )
    } else {
      const existingRating = entry.userRatings?.find((r) => r.userId === userId)

      if (existingRating) {
        await entries.updateOne(
          { _id: new ObjectId(entryId), "userRatings.userId": userId },
          {
            $set: {
              "userRatings.$.rating": rating,
              "userRatings.$.ratedAt": now,
              updatedAt: now,
            },
          }
        )
      } else {
        await entries.updateOne(
          { _id: new ObjectId(entryId) },
          {
            $push: {
              userRatings: {
                userId,
                rating,
                ratedAt: now,
              },
            },
            $set: { updatedAt: now },
          }
        )
      }
    }

    const result = await entries
      .aggregate([
        { $match: { _id: new ObjectId(entryId) } },
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
          $addFields: {
            watches: {
              $sortArray: {
                input: "$watches",
                sortBy: { startDate: 1, addedAt: 1 },
              },
            },
          },
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            listId: { $toString: "$listId" },
            mediaId: { $toString: "$mediaId" },
            addedByUserId: 1,
            watches: 1,
            userRatings: 1,
            entryStatus: 1,
            firstStartDate: 1,
            firstEndDate: 1,
            lastStartDate: 1,
            lastEndDate: 1,
            lastPlatform: 1,
            platform: 1,
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

    return NextResponse.json(result[0])
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
