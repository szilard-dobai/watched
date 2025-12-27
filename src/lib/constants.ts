export const PLATFORMS = [
  "Netflix",
  "Hulu",
  "Disney+",
  "Amazon Prime",
  "HBO Max",
  "Apple TV+",
  "Paramount+",
  "Peacock",
  "Cinema",
  "Blu-ray/DVD",
  "Other",
] as const

export const MEDIA_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
] as const

export const ENTRY_STATUSES = ["planned", "in_progress", "finished"] as const

export const ENTRY_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "finished", label: "Finished" },
] as const

export const WATCH_STATUSES = ["in_progress", "finished"] as const

export const WATCH_STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "finished", label: "Finished" },
] as const

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
] as const
