export const STATUS_OPTIONS = [
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "want_to_watch", label: "Want to Watch" },
] as const;

export const TYPE_OPTIONS = [
  { value: "movie", label: "Movie" },
  { value: "tv_show", label: "TV Show" },
] as const;

export const PLATFORMS = [
  "Netflix",
  "Hulu",
  "Disney+",
  "Amazon Prime",
  "HBO Max",
  "Apple TV+",
  "Paramount+",
  "Peacock",
  "Other",
] as const;

export const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  ...STATUS_OPTIONS,
] as const;

export const FILTER_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...TYPE_OPTIONS,
] as const;
