export type WatchStatus = "watching" | "completed" | "want_to_watch";
export type MediaType = "movie" | "tv_show";

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type: "movie" | "tv";
}

export interface WatchedItem {
  _id: string;
  title: string;
  type: MediaType;
  status: WatchStatus;
  platform: string;
  tmdbId?: number;
  posterPath?: string | null;
  description?: string;
  tmdbRating?: number;
  genres?: string[];
  duration?: number;
  seasons?: number;
  userRating?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchedItemFormData {
  title: string;
  type: MediaType;
  status: WatchStatus;
  platform: string;
  tmdbId?: number;
  posterPath?: string | null;
  description?: string;
  tmdbRating?: number;
  genres?: string[];
  duration?: number;
  seasons?: number;
  userRating?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface WatchStats {
  totalMovies: number;
  totalTvShows: number;
  completedCount: number;
  watchingCount: number;
  averageRating: number | null;
}

export interface FilterState {
  search: string;
  status: WatchStatus | "all";
  type: MediaType | "all";
}
