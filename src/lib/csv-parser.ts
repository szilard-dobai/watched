import Papa from "papaparse"
import type {
  CSVColumnMapping,
  CSVRow,
  EntryStatus,
  MediaType,
  ParsedCSVEntry,
  UserRatingValue,
} from "@/types"

export const parseCSV = (
  file: File
): Promise<{ headers: string[]; rows: CSVRow[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as CSVRow[]
        resolve({ headers, rows })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

export const normalizeStatus = (value: string): EntryStatus | null => {
  const normalized = value.toLowerCase().trim()

  const plannedValues = ["planned", "plan", "to watch", "watchlist", "want to watch"]
  const inProgressValues = ["watching", "in progress", "in_progress", "started", "currently watching"]
  const finishedValues = ["finished", "watched", "completed", "done", "seen"]

  if (plannedValues.includes(normalized)) return "planned"
  if (inProgressValues.includes(normalized)) return "in_progress"
  if (finishedValues.includes(normalized)) return "finished"

  return null
}

export const normalizeMediaType = (value: string): MediaType | null => {
  const normalized = value.toLowerCase().trim()

  const movieValues = ["movie", "film", "movies", "films"]
  const tvValues = ["tv", "tv show", "series", "show", "television", "tv series"]

  if (movieValues.includes(normalized)) return "movie"
  if (tvValues.includes(normalized)) return "tv"

  return null
}

export const parseDate = (value: string): string | null => {
  if (!value || !value.trim()) return null

  const trimmed = value.trim()

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return trimmed

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const euMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (euMatch) {
    const [, day, month, year] = euMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const dateObj = new Date(trimmed)
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split("T")[0]
  }

  return null
}

export const normalizeRating = (value: string): UserRatingValue | null => {
  const normalized = value.toLowerCase().trim()

  const lovedValues = ["loved", "love", "5", "10", "amazing", "excellent", "favorite"]
  const likedValues = ["liked", "like", "4", "8", "9", "good", "great"]
  const dislikedValues = ["disliked", "dislike", "1", "2", "3", "bad", "poor", "awful"]

  if (lovedValues.includes(normalized)) return "loved"
  if (likedValues.includes(normalized)) return "liked"
  if (dislikedValues.includes(normalized)) return "disliked"

  return null
}

export const parseTmdbId = (value: string): number | null => {
  if (!value || !value.trim()) return null
  const parsed = parseInt(value.trim(), 10)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

export const mapRowToEntry = (
  row: CSVRow,
  mapping: CSVColumnMapping
): ParsedCSVEntry | null => {
  const getValue = (columnName: string | null): string => {
    if (!columnName) return ""
    return row[columnName]?.trim() || ""
  }

  const title = getValue(mapping.title)
  if (!title) return null

  const tmdbIdValue = getValue(mapping.tmdbId)
  const tmdbId = parseTmdbId(tmdbIdValue)

  const mediaTypeValue = getValue(mapping.mediaType)
  const mediaType = normalizeMediaType(mediaTypeValue) || "movie"

  const statusValue = getValue(mapping.status)
  const status = normalizeStatus(statusValue)

  const startDate = parseDate(getValue(mapping.startDate))
  const endDate = parseDate(getValue(mapping.endDate))

  const platform = getValue(mapping.platform) || null
  const notes = getValue(mapping.notes) || null

  const ratingValue = getValue(mapping.rating)
  const rating = normalizeRating(ratingValue)

  return {
    tmdbId,
    title,
    mediaType,
    status,
    startDate,
    endDate,
    platform,
    notes,
    rating,
  }
}

export const inferStatus = (entry: ParsedCSVEntry): EntryStatus => {
  if (entry.status) return entry.status

  if (entry.endDate) return "finished"
  if (entry.startDate) return "in_progress"
  return "planned"
}

const COMMON_TMDB_ID_NAMES = ["tmdbid", "tmdb_id", "tmdb id", "tmdb"]
const COMMON_TITLE_NAMES = ["title", "name", "movie", "show", "film"]
const COMMON_TYPE_NAMES = ["type", "media type", "mediatype", "kind", "category"]
const COMMON_STATUS_NAMES = ["status", "watch status", "state"]
const COMMON_START_NAMES = ["start", "start date", "startdate", "started", "began", "date started"]
const COMMON_END_NAMES = ["end", "end date", "enddate", "finished", "completed", "date finished", "date completed"]
const COMMON_PLATFORM_NAMES = ["platform", "service", "streaming", "where", "watched on"]
const COMMON_NOTES_NAMES = ["notes", "note", "comments", "comment", "review"]
const COMMON_RATING_NAMES = ["rating", "score", "my rating", "your rating"]

export const autoDetectMapping = (headers: string[]): CSVColumnMapping => {
  const findMatch = (commonNames: string[]): string | null => {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
    for (const name of commonNames) {
      const index = lowerHeaders.indexOf(name)
      if (index !== -1) return headers[index]
    }
    return null
  }

  return {
    tmdbId: findMatch(COMMON_TMDB_ID_NAMES),
    title: findMatch(COMMON_TITLE_NAMES),
    mediaType: findMatch(COMMON_TYPE_NAMES),
    status: findMatch(COMMON_STATUS_NAMES),
    startDate: findMatch(COMMON_START_NAMES),
    endDate: findMatch(COMMON_END_NAMES),
    platform: findMatch(COMMON_PLATFORM_NAMES),
    notes: findMatch(COMMON_NOTES_NAMES),
    rating: findMatch(COMMON_RATING_NAMES),
  }
}
