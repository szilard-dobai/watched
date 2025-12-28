export type MediaType = "movie" | "tv";
export type ListRole = "owner" | "member";
export type WatchStatus = "in_progress" | "finished";
export type EntryStatus = "planned" | WatchStatus;
export type UserRatingValue = "disliked" | "liked" | "loved";

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type: MediaType;
  original_language: string;
  original_title?: string;
  original_name?: string;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  status: string;
  imdb_id: string | null;
  original_language: string;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  status: string;
  original_language: string;
  networks: { id: number; name: string; logo_path: string | null }[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Network {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface Watch {
  _id: string;
  status: WatchStatus;
  startDate?: string;
  endDate?: string;
  platform?: string;
  notes?: string;
  addedByUserId: string;
  addedAt: string;
}

export interface Entry {
  _id: string;
  listId: string;
  addedByUserId: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  firstAirDate?: string;
  runtime?: number | null;
  episodeRunTime?: number[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: Genre[];
  voteAverage: number;
  voteCount: number;
  popularity: number;
  status: string;
  imdbId?: string | null;
  originalLanguage: string;
  networks?: Network[];
  platform?: string;
  watches: Watch[];
  userRating?: UserRatingValue | null;
  entryStatus: EntryStatus;
  firstStartDate: string | null;
  firstEndDate: string | null;
  lastStartDate: string | null;
  lastEndDate: string | null;
  lastPlatform: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EntryFormDataBase {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  firstAirDate?: string;
  runtime?: number | null;
  episodeRunTime?: number[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: Genre[];
  voteAverage: number;
  voteCount: number;
  popularity: number;
  status: string;
  imdbId?: string | null;
  originalLanguage: string;
  networks?: Network[];
  platform?: string;
  notes?: string;
  rating?: UserRatingValue;
}

interface EntryFormDataPlanned extends EntryFormDataBase {
  watchStatus: "planned";
  startDate?: never;
  endDate?: never;
}

interface EntryFormDataInProgress extends EntryFormDataBase {
  watchStatus: "in_progress";
  startDate: string;
  endDate?: never;
}

interface EntryFormDataFinished extends EntryFormDataBase {
  watchStatus: "finished";
  startDate: string;
  endDate: string;
}

export type EntryFormData =
  | EntryFormDataPlanned
  | EntryFormDataInProgress
  | EntryFormDataFinished;

export interface WatchFormData {
  status: WatchStatus;
  startDate?: string;
  endDate?: string;
  platform?: string;
  notes?: string;
}

export interface List {
  _id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMembership {
  _id: string;
  userId: string;
  listId: string;
  role: ListRole;
  joinedAt: string;
}

export interface ListWithRole extends List {
  role: ListRole;
  memberCount?: number;
}

export interface User {
  _id: ObjectId;
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardFilterState {
  search: string;
  listId: string | "all";
  mediaType: MediaType | "all";
  genre: string | "all";
  platform: string | "all";
}

export interface DashboardStats {
  totalMovies: number;
  totalTvShows: number;
  totalWatches: number;
  totalEntries: number;
  averageRating: number | null;
}

import type { ObjectId } from "mongodb";

export interface DbList {
  _id: ObjectId;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbListMembership {
  _id: ObjectId;
  userId: string;
  listId: ObjectId;
  role: ListRole;
  joinedAt: string;
}

export interface DbWatch {
  _id: string;
  status: WatchStatus;
  startDate?: string;
  endDate?: string;
  platform?: string;
  notes?: string;
  addedByUserId: string;
  addedAt: string;
}

export interface DbMedia {
  _id: ObjectId;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  firstAirDate?: string;
  runtime?: number | null;
  episodeRunTime?: number[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: Genre[];
  voteAverage: number;
  voteCount: number;
  popularity: number;
  status: string;
  imdbId?: string | null;
  originalLanguage: string;
  networks?: Network[];
  createdAt: string;
  updatedAt: string;
}

export interface Media extends Omit<DbMedia, "_id"> {
  _id: string;
}

export interface EntryMeta {
  entryStatus: EntryStatus;
  firstStartDate: string | null;
  firstEndDate: string | null;
  lastStartDate: string | null;
  lastEndDate: string | null;
  lastPlatform: string | null;
}

export interface DbEntry extends EntryMeta {
  _id: ObjectId;
  listId: ObjectId;
  mediaId: ObjectId;
  addedByUserId: string;
  platform?: string;
  watches: DbWatch[];
  userRating?: UserRatingValue | null;
  createdAt: string;
  updatedAt: string;
}
