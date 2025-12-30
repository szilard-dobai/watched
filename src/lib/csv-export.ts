import type { Entry, Watch } from "@/types"

export interface CSVExportRow {
  tmdbId: number
  title: string
  mediaType: "movie" | "tv"
  status: "planned" | "in_progress" | "finished"
  startDate: string
  endDate: string
  platform: string
  notes: string
  rating: string
}

const escapeCSVField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const formatWatch = (
  entry: Entry,
  watch: Watch,
  userRating: string
): CSVExportRow => ({
  tmdbId: entry.tmdbId,
  title: entry.title,
  mediaType: entry.mediaType,
  status: watch.status,
  startDate: watch.startDate || "",
  endDate: watch.endDate || "",
  platform: watch.platform || "",
  notes: watch.notes || "",
  rating: userRating,
})

const formatPlannedEntry = (entry: Entry, userRating: string): CSVExportRow => ({
  tmdbId: entry.tmdbId,
  title: entry.title,
  mediaType: entry.mediaType,
  status: "planned",
  startDate: "",
  endDate: "",
  platform: entry.platform || "",
  notes: "",
  rating: userRating,
})

export const entriesToCSV = (entries: Entry[]): string => {
  const headers = [
    "tmdbId",
    "title",
    "mediaType",
    "status",
    "startDate",
    "endDate",
    "platform",
    "notes",
    "rating",
  ]

  const rows: CSVExportRow[] = []

  for (const entry of entries) {
    const userRating = entry.userRating || ""

    if (entry.watches.length === 0) {
      rows.push(formatPlannedEntry(entry, userRating))
    } else {
      for (const watch of entry.watches) {
        rows.push(formatWatch(entry, watch, userRating))
      }
    }
  }

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCSVField(String(row[header as keyof CSVExportRow] || "")))
        .join(",")
    ),
  ]

  return csvLines.join("\n")
}

export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
