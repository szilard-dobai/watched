import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { requireAuth } from "@/lib/api/auth-helpers"
import { checkListAccess } from "@/lib/api/list-helpers"
import { getEntriesCollection, getMediaCollection } from "@/lib/db/collections"
import { computeEntryMeta } from "@/lib/entry-meta"
import type { DbWatch, EntryFormData } from "@/types"

interface RouteParams {
  params: Promise<{ listId: string }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const entries = await getEntriesCollection()

    const listEntries = await entries
      .aggregate([
        { $match: { listId: new ObjectId(listId) } },
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
        { $sort: { updatedAt: -1 } },
      ])
      .toArray()

    return NextResponse.json(listEntries)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await requireAuth()
    const { listId } = await params

    const role = await checkListAccess(listId, session.user.id)
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const data: EntryFormData = await request.json()

    const entries = await getEntriesCollection()
    const media = await getMediaCollection()

    let mediaDoc = await media.findOne({
      tmdbId: data.tmdbId,
      mediaType: data.mediaType,
    })

    const now = new Date().toISOString()

    if (!mediaDoc) {
      const mediaId = new ObjectId()
      mediaDoc = {
        _id: mediaId,
        tmdbId: data.tmdbId,
        mediaType: data.mediaType,
        title: data.title,
        originalTitle: data.originalTitle,
        overview: data.overview,
        posterPath: data.posterPath,
        backdropPath: data.backdropPath,
        releaseDate: data.releaseDate,
        firstAirDate: data.firstAirDate,
        runtime: data.runtime,
        episodeRunTime: data.episodeRunTime,
        numberOfSeasons: data.numberOfSeasons,
        numberOfEpisodes: data.numberOfEpisodes,
        genres: data.genres,
        voteAverage: data.voteAverage,
        voteCount: data.voteCount,
        popularity: data.popularity,
        status: data.status,
        imdbId: data.imdbId,
        originalLanguage: data.originalLanguage,
        networks: data.networks,
        createdAt: now,
        updatedAt: now,
      }
      await media.insertOne(mediaDoc)
    }

    const existingEntry = await entries.findOne({
      listId: new ObjectId(listId),
      mediaId: mediaDoc._id,
    })

    const isPlanned = data.watchStatus === "planned"
    const newWatch = isPlanned
      ? null
      : {
          _id: new ObjectId().toString(),
          status: data.watchStatus,
          startDate: data.startDate,
          endDate: data.endDate,
          platform: data.platform,
          notes: data.notes,
          addedByUserId: session.user.id,
          addedAt: now,
        }

    if (existingEntry) {
      const updatedWatches: DbWatch[] = newWatch
        ? [...existingEntry.watches, newWatch]
        : existingEntry.watches

      const meta = computeEntryMeta(updatedWatches)

      if (newWatch) {
        await entries.updateOne(
          { _id: existingEntry._id },
          {
            $push: { watches: newWatch },
            $set: { updatedAt: now, ...meta },
          }
        )
      }

      return NextResponse.json(
        {
          _id: existingEntry._id.toString(),
          listId: listId,
          mediaId: mediaDoc._id.toString(),
          addedByUserId: existingEntry.addedByUserId,
          tmdbId: mediaDoc.tmdbId,
          mediaType: mediaDoc.mediaType,
          title: mediaDoc.title,
          originalTitle: mediaDoc.originalTitle,
          overview: mediaDoc.overview,
          posterPath: mediaDoc.posterPath,
          backdropPath: mediaDoc.backdropPath,
          releaseDate: mediaDoc.releaseDate,
          firstAirDate: mediaDoc.firstAirDate,
          runtime: mediaDoc.runtime,
          episodeRunTime: mediaDoc.episodeRunTime,
          numberOfSeasons: mediaDoc.numberOfSeasons,
          numberOfEpisodes: mediaDoc.numberOfEpisodes,
          genres: mediaDoc.genres,
          voteAverage: mediaDoc.voteAverage,
          voteCount: mediaDoc.voteCount,
          popularity: mediaDoc.popularity,
          status: mediaDoc.status,
          imdbId: mediaDoc.imdbId,
          originalLanguage: mediaDoc.originalLanguage,
          networks: mediaDoc.networks,
          platform: existingEntry.platform,
          watches: updatedWatches,
          userRating: existingEntry.userRating,
          ...meta,
          createdAt: existingEntry.createdAt,
          updatedAt: now,
        },
        { status: 200 }
      )
    }

    const entryId = new ObjectId()
    const watches: DbWatch[] = newWatch ? [newWatch] : []
    const meta = computeEntryMeta(watches)

    const entry = {
      _id: entryId,
      listId: new ObjectId(listId),
      mediaId: mediaDoc._id,
      addedByUserId: session.user.id,
      platform: isPlanned ? data.platform : undefined,
      watches,
      userRating: data.rating ?? null,
      ...meta,
      createdAt: now,
      updatedAt: now,
    }

    await entries.insertOne(entry)

    return NextResponse.json(
      {
        _id: entryId.toString(),
        listId: listId,
        mediaId: mediaDoc._id.toString(),
        addedByUserId: session.user.id,
        tmdbId: mediaDoc.tmdbId,
        mediaType: mediaDoc.mediaType,
        title: mediaDoc.title,
        originalTitle: mediaDoc.originalTitle,
        overview: mediaDoc.overview,
        posterPath: mediaDoc.posterPath,
        backdropPath: mediaDoc.backdropPath,
        releaseDate: mediaDoc.releaseDate,
        firstAirDate: mediaDoc.firstAirDate,
        runtime: mediaDoc.runtime,
        episodeRunTime: mediaDoc.episodeRunTime,
        numberOfSeasons: mediaDoc.numberOfSeasons,
        numberOfEpisodes: mediaDoc.numberOfEpisodes,
        genres: mediaDoc.genres,
        voteAverage: mediaDoc.voteAverage,
        voteCount: mediaDoc.voteCount,
        popularity: mediaDoc.popularity,
        status: mediaDoc.status,
        imdbId: mediaDoc.imdbId,
        originalLanguage: mediaDoc.originalLanguage,
        networks: mediaDoc.networks,
        platform: isPlanned ? data.platform : undefined,
        watches,
        userRating: data.rating ?? null,
        ...meta,
        createdAt: now,
        updatedAt: now,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
