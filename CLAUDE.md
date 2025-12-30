# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movie and TV show tracking app for personal use. Users can log watched content, track progress through shared lists, and get metadata from TMDB. Features role-based permissions with three roles: owner (full control), member (own entries only), and viewer (read-only with copy functionality).

## Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix lint issues
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run check` - Run lint, type-check, and tests
- `npm run format` - Format with Prettier

## Architecture

Next.js 16 App Router with React 19, deployed on Vercel.

**Data & API:**

- MongoDB Atlas for data storage (6 collections: lists, listMemberships, entries, media, user, session)
- TMDB API for movie/TV show metadata
- Better Auth for session-based authentication (7-day expiration)

**State Management:**

- TanStack React Query for server state and caching
- React Hook Form + Zod for form validation
- Query keys defined in `src/lib/query-keys.ts`
- `useLocalStorage` hook for persisting user preferences (view mode, sorting, filters)

**UI Stack:**

- Tailwind CSS 4 for utility styling
- Radix UI for accessible primitives (Dialog, Select, Popover, etc.)
- MUI + Emotion for complex components (DataGrid for table view)
- Lucide React for icons
- date-fns for date formatting

**Testing:**

- Vitest + Testing Library for unit/integration tests
- MSW (Mock Service Worker) for API mocking
- Test files: `*.test.ts` or `*.test.tsx` alongside source files

## Key Patterns

- Uses `src/` directory pattern (app router lives in `src/app/`)
- Server Components by default (use `"use client"` directive for client components)
- Path alias: `@/*` maps to `src/`
- Always use arrow functions, never function declarations
- No comments in code unless absolutely necessary (code should be self-documenting)
- Use `useWatch` from react-hook-form instead of `watch()` for React Compiler compatibility
- Derive state from React Query cache when possible to avoid stale data

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/[...all]/     # Better Auth handler
│   │   ├── entries/           # Global entries + /shared endpoint
│   │   ├── lists/             # List CRUD
│   │   │   ├── [listId]/entries/  # Entries per list
│   │   │   │   └── [entryId]/     # Entry operations + watches + rating
│   │   │   ├── [listId]/members/  # Member management
│   │   │   ├── [listId]/leave/    # Leave list
│   │   │   └── join/              # Join via invite
│   │   └── tmdb/              # TMDB proxy (search, details)
│   ├── page.tsx               # Dashboard (owner/member entries)
│   ├── shared/page.tsx        # Viewer entries page
│   ├── lists/                 # Lists management + settings
│   ├── login/, register/      # Auth pages
│   └── join/[inviteCode]/     # Join list via invite
├── components/
│   ├── ui/                    # Reusable primitives (Button, Dialog, Select, etc.)
│   ├── forms/                 # Modals (AddEntry, EditEntry, CSVImport, ViewerEntry)
│   ├── lists/                 # List management components
│   └── auth/                  # Login/register forms, user menu
├── hooks/                     # Custom hooks (useLists, useEntries, useSharedEntries, etc.)
├── lib/
│   ├── auth.ts               # Better Auth server config
│   ├── auth-client.ts        # Better Auth client exports
│   ├── schemas.ts            # Zod validation schemas
│   ├── constants.ts          # App constants (platforms, genres, status, sort options)
│   ├── query-keys.ts         # React Query key factory
│   ├── csv-parser.ts         # CSV import with TMDB lookup
│   ├── csv-export.ts         # CSV export utilities
│   ├── entry-meta.ts         # Entry metadata computation
│   ├── utils.ts              # General utilities (cn, date formatting)
│   ├── db/                   # MongoDB connection and collection helpers
│   └── api/                  # API helpers and client fetchers
├── types/index.ts            # All TypeScript types
├── providers/                # React Query and Theme providers
├── test/                     # Test setup and MSW mocks
└── middleware.ts             # Auth middleware
```

## Data Types

**Core enums:**
- `MediaType`: "movie" | "tv"
- `EntryStatus`: "planned" | "in_progress" | "finished"
- `WatchStatus`: "in_progress" | "finished"
- `UserRatingValue`: "disliked" | "liked" | "loved"
- `ListRole`: "owner" | "member" | "viewer"

**Key interfaces:**
- `Entry` - Denormalized entry with media fields flattened and computed metadata
- `DbEntry` - Raw database entry with mediaId reference
- `ViewerEntry` - Sanitized entry for viewers (no watch details)
- `Watch` - Individual watch record (embedded in entry)
- `List` - List with role and member count
- `EntryFormData` - Discriminated union based on watchStatus

## Environment Variables

Store in `.env.local` (gitignored):

```
MONGODB_URI=<MongoDB connection string>
MONGODB_DB=<Database name>
TMDB_API_KEY=<TMDB API key>
BETTER_AUTH_SECRET=<Auth secret>
BETTER_AUTH_URL=<Base URL>
```

## Workflow Rules

**Testing requirements:**

- All code changes must include tests when relevant
- Write tests for new components, utilities, hooks, and API routes
- Place test files alongside source files: `Component.tsx` → `Component.test.tsx`
- Use MSW handlers in `src/test/mocks/handlers.ts` for API mocking

**Pre-commit checks:**

- Before committing, always run `/check` to verify lint, type-check, and tests pass
- Run `/fix` to auto-fix any linting/formatting issues
- Ensure all tests pass with `npm run test:run`

**Code style:**

- Arrow functions only, no function declarations
- Minimal comments - code should be self-documenting
- Use `useWatch({ control, name: "field" })` instead of `watch("field")` in forms
- Derive state from React Query cache when possible to avoid stale data

## Database Collections

1. **lists** - List documents (name, ownerId, inviteCode)
2. **listMemberships** - User-list relationships with role (owner/member/viewer)
3. **entries** - Entry documents with embedded watches array
4. **media** - TMDB metadata cache (shared across entries)
5. **user** - Better Auth user collection
6. **session** - Better Auth sessions

## API Authentication

All API routes (except auth) require authentication via `requireAuth()` helper from `src/lib/api/auth-helpers.ts`. This validates the session and returns the user ID.

Authorization is role-based per list:
- `owner` - Full control (edit list, manage members, delete any entry)
- `member` - Can add entries, edit/delete only their own entries
- `viewer` - Read-only access, can copy entries to their own lists

## Key Features Implementation

**View Modes (Gallery, List, Table):**
- Persisted via `useLocalStorage` hook
- Gallery: poster grid with quick actions
- List: detailed cards with full metadata
- Table: MUI DataGrid with sortable columns

**CSV Import/Export:**
- Import parses CSV and looks up TMDB by title + optional TMDB ID
- Supports cancellation during import via ref-based flag
- Export includes all entry data in standardized format
- Smart duplicate handling on import

**Viewer Dashboard Separation:**
- Main dashboard (`/`) shows owner/member entries with full functionality
- Shared page (`/shared`) shows viewer entries with limited data (no watch details)
- `/api/entries/shared` endpoint returns sanitized ViewerEntry type
- ViewerEntryModal allows copying entries to user's own lists
