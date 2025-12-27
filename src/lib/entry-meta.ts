import type { DbWatch, EntryMeta, EntryStatus } from "@/types"

export const computeEntryMeta = (watches: DbWatch[]): EntryMeta => {
  if (watches.length === 0) {
    return {
      entryStatus: "planned",
      firstStartDate: null,
      firstEndDate: null,
      lastStartDate: null,
      lastEndDate: null,
      lastPlatform: null,
    }
  }

  const sorted = [...watches].sort((a, b) => {
    const aDate = a.startDate ?? a.addedAt
    const bDate = b.startDate ?? b.addedAt
    return aDate.localeCompare(bDate)
  })

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return {
    entryStatus: last.status as EntryStatus,
    firstStartDate: first.startDate ?? null,
    firstEndDate: first.endDate ?? null,
    lastStartDate: last.startDate ?? null,
    lastEndDate: last.endDate ?? null,
    lastPlatform: last.platform ?? null,
  }
}
