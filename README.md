# Watched

Movie and TV show tracking app for personal use. Track what you've watched, share lists with friends and family, and browse your viewing history.

## Features

- **User authentication** - Email/password authentication via Better Auth
- **Shared lists** - Create or join lists via invite links with role-based permissions (owner, member, viewer)
- **TMDB integration** - Search and add movies/TV shows with full metadata (posters, genres, ratings, etc.)
- **Watch history** - Track multiple viewings with dates, platforms, and notes
- **User ratings** - Rate entries as "disliked", "liked", or "loved"
- **Dashboard** - View all entries across lists with advanced filtering and sorting
- **Multiple view modes** - Gallery (poster grid), list (detailed), and table (spreadsheet) views
- **CSV import/export** - Import from and export to CSV with smart duplicate handling
- **Viewer mode** - Share lists with read-only access, viewers can copy entries to their own lists
- **Dark mode** - System-aware theme switching

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: MongoDB Atlas
- **Auth**: Better Auth (session-based, 7-day expiration)
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **External API**: TMDB for movie/TV metadata
- **Styling**: Tailwind CSS 4, Radix UI primitives, MUI components
- **Testing**: Vitest + Testing Library + MSW
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
MONGODB_DB=your_database_name
TMDB_API_KEY=your_tmdb_api_key
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Better Auth handler
│   │   ├── entries/       # Global entries + shared entries endpoints
│   │   ├── lists/         # List CRUD + members + join/leave
│   │   └── tmdb/          # TMDB search and details proxy
│   ├── page.tsx           # Dashboard (home)
│   ├── shared/            # Viewer entries page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── lists/             # Lists management + settings pages
│   └── join/[inviteCode]/ # Join list via invite
├── components/
│   ├── ui/                # Reusable UI components (Button, Dialog, Select, etc.)
│   ├── forms/             # Form components (AddEntryModal, EditEntryModal, CSVImportModal, etc.)
│   ├── lists/             # List-related components
│   └── auth/              # Auth forms and user menu
├── hooks/                 # Custom React hooks (useLists, useEntries, useLocalStorage, etc.)
├── lib/
│   ├── auth.ts            # Better Auth server config
│   ├── auth-client.ts     # Better Auth client
│   ├── schemas.ts         # Zod validation schemas
│   ├── constants.ts       # App constants
│   ├── csv-parser.ts      # CSV import parsing utilities
│   ├── csv-export.ts      # CSV export utilities
│   ├── entry-meta.ts      # Entry metadata computation
│   ├── query-keys.ts      # React Query key factory
│   ├── db/                # MongoDB connection and collections
│   └── api/               # API helpers and fetchers
├── types/                 # TypeScript type definitions
├── providers/             # React Query and Theme providers
└── test/                  # Test setup and mocks
```

## Data Model

### Lists
- Created by a user (owner)
- Shareable via invite link
- Three roles: `owner` (full control), `member` (own entries only), `viewer` (read-only)

### Entries
- Bound to a list
- References cached media metadata
- Tracks who added it and when
- Status: `planned`, `in_progress`, or `finished`
- Optional user rating: `disliked`, `liked`, or `loved`
- Optional platform (e.g., Netflix, Disney+, Cinema)

### Watches
- Embedded in entries as an array
- Records each viewing with:
  - `startDate` (required for non-planned)
  - `endDate` (optional, defaults to start date for movies)
  - `platform` (optional)
  - `notes` (optional)
  - `status`: `in_progress` or `finished`

### Media (TMDB Cache)
- Stored once per unique movie/TV show
- Contains: title, overview, poster, backdrop, genres, ratings, runtime, etc.
- TV-specific: seasons, episodes, networks

## API Routes

### Authentication
- `POST/GET /api/auth/[...all]` - Better Auth handler

### Lists
- `GET /api/lists` - Get user's lists
- `POST /api/lists` - Create list
- `GET/PATCH/DELETE /api/lists/[listId]` - List operations
- `GET/PATCH/DELETE /api/lists/[listId]/members` - Member management
- `GET/POST /api/lists/join` - Join via invite code
- `POST /api/lists/[listId]/leave` - Leave list

### Entries
- `GET /api/entries` - All entries across all lists
- `GET /api/entries/shared` - Entries from viewer-only lists
- `GET/POST /api/lists/[listId]/entries` - List entries
- `GET/PATCH/DELETE /api/lists/[listId]/entries/[entryId]` - Entry operations
- `PUT /api/lists/[listId]/entries/[entryId]/rating` - Update rating

### Watches
- `POST /api/lists/[listId]/entries/[entryId]/watches` - Add watch
- `PATCH/DELETE /api/lists/[listId]/entries/[entryId]/watches/[watchId]` - Watch operations

### TMDB
- `GET /api/tmdb/search?query=...` - Search movies/TV
- `GET /api/tmdb/[mediaType]/[id]` - Get details

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run type-check   # TypeScript type checking
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run check        # Lint + type-check + tests
npm run format       # Format with Prettier
```
