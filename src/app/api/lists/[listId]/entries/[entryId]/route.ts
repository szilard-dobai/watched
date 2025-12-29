import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess, checkEntryPermission } from "@/lib/api/list-helpers"
import { getEntriesCollection, getMediaCollection } from "@/lib/db/collections"
import type { Entry } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string; entryId: string }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()
    const result = await entries
      .aggregate([
        {
          $match: {
            _id: new ObjectId(entryId),
            listId: new ObjectId(listId),
          },
        },
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
            userRating: 1,
            ownerRating: 1,
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

    if (result.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Viewers cannot edit entries" },
        { status: 403 }
      )
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (!checkEntryPermission(entry as unknown as Entry, session.user.id, role)) {
      return NextResponse.json(
        { error: "Not authorized to edit this entry" },
        { status: 403 }
      )
    }

    const updates = await request.json()
    const now = new Date().toISOString()

    const filteredUpdates: Record<string, unknown> = {
      updatedAt: now,
    }

    if ("platform" in updates) {
      filteredUpdates.platform = updates.platform
    }

    if (updates.media) {
      const media = await getMediaCollection()
      let mediaDoc = await media.findOne({
        tmdbId: updates.media.tmdbId,
        mediaType: updates.media.mediaType,
      })

      if (!mediaDoc) {
        const mediaId = new ObjectId()
        mediaDoc = {
          _id: mediaId,
          tmdbId: updates.media.tmdbId,
          mediaType: updates.media.mediaType,
          title: updates.media.title,
          originalTitle: updates.media.originalTitle,
          overview: updates.media.overview,
          posterPath: updates.media.posterPath,
          backdropPath: updates.media.backdropPath,
          releaseDate: updates.media.releaseDate,
          firstAirDate: updates.media.firstAirDate,
          runtime: updates.media.runtime,
          episodeRunTime: updates.media.episodeRunTime,
          numberOfSeasons: updates.media.numberOfSeasons,
          numberOfEpisodes: updates.media.numberOfEpisodes,
          genres: updates.media.genres,
          voteAverage: updates.media.voteAverage,
          voteCount: updates.media.voteCount,
          popularity: updates.media.popularity,
          status: updates.media.status,
          imdbId: updates.media.imdbId,
          originalLanguage: updates.media.originalLanguage,
          networks: updates.media.networks,
          createdAt: now,
          updatedAt: now,
        }
        await media.insertOne(mediaDoc)
      }

      filteredUpdates.mediaId = mediaDoc._id
    }

    await entries.updateOne(
      { _id: new ObjectId(entryId) },
      { $set: filteredUpdates }
    )

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
            userRating: 1,
            ownerRating: 1,
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

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId, entryId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Viewers cannot delete entries" },
        { status: 403 }
      )
    }

    const entries = await getEntriesCollection()
    const entry = await entries.findOne({
      _id: new ObjectId(entryId),
      listId: new ObjectId(listId),
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    if (!checkEntryPermission(entry as unknown as Entry, session.user.id, role)) {
      return NextResponse.json(
        { error: "Not authorized to delete this entry" },
        { status: 403 }
      )
    }

    await entries.deleteOne({ _id: new ObjectId(entryId) })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
