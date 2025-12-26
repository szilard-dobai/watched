# Watched

Movie and TV show tracking app for personal use. Track what you've watched, share lists with friends and family, and browse your viewing history.

## Features

- **User authentication** via email/password (Better Auth)
- **Shared lists** - create or join lists via invite links
- **TMDB integration** - search and add movies/TV shows with full metadata
- **Watch history** - track rewatches with dates, platforms, and notes
- **Dashboard** - view all entries in reverse chronological order, filter by list, genre, platform

## Data Model

### Users
- Email/password authentication
- Can belong to multiple lists

### Lists
- Created by a user (owner)
- Shareable via invite link
- Two roles: `owner` (full control) and `member` (own entries only)

### Entries
- Bound to a list
- Tracks who added it
- Caches TMDB metadata (title, poster, genres, runtime, etc.)
- Supports multiple watches via `watches` array:
  - `startDate` (required)
  - `endDate` (optional)
  - `platform` (optional)
  - `notes` (optional)

### TMDB Data Cached Per Entry
- `tmdbId`, `mediaType` (movie/tv)
- `title`, `originalTitle`, `overview`
- `posterPath`, `backdropPath`
- `releaseDate` / `firstAirDate`
- `runtime` / `episodeRunTime`
- `genres`, `voteAverage`, `voteCount`, `popularity`
- `status`, `imdbId`, `originalLanguage`
- TV-specific: `numberOfSeasons`, `numberOfEpisodes`, `networks`

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: MongoDB Atlas
- **Auth**: Better Auth
- **External API**: TMDB for movie/TV metadata
- **Styling**: Tailwind CSS 4, Radix UI, MUI
- **Deployment**: Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file with:

```
MONGODB_URI=your_mongodb_connection_string
TMDB_API_KEY=your_tmdb_api_key
```
