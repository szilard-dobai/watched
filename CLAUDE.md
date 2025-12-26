# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movie and TV show tracking app for personal use. Users can log watched content, track progress, and get metadata from TMDB.

## Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once

## Architecture

Next.js 16 App Router with React 19, deployed on Vercel.

**Data & API:**
- MongoDB Atlas for data storage
- TMDB API for movie/TV show metadata

**UI Stack:**
- Tailwind CSS 4 for utility styling
- Radix UI for accessible primitives
- MUI + Emotion for complex components
- date-fns for date formatting

**Testing:**
- Vitest + Testing Library
- Test files: `*.test.ts` or `*.test.tsx`

**Key patterns:**
- Uses `src/` directory pattern (app router lives in `src/app/`)
- Server Components by default (use `"use client"` directive for client components)
- Path alias: `@/*` maps to `src/`
- Always use arrow functions, never function declarations

**Environment variables:**
- Store in `.env.local` (gitignored)
- Required: `MONGODB_URI`, `TMDB_API_KEY`

## Workflow Rules

**Testing requirements:**
- All code changes must include tests when relevant
- Write tests for new components, utilities, hooks, and API routes
- Place test files alongside source files: `Component.tsx` → `Component.test.tsx`

**Pre-commit checks:**
- Before committing, always run `/check` to verify lint and type-check pass
- Run `/fix` to auto-fix any linting/formatting issues
- Ensure all tests pass with `npm run test:run`
