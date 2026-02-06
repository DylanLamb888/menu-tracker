# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Menu version control system for La Maison Ani London restaurant. Centralizes menu PDF management with version trees, approval workflows, role-based access, and collaborative feedback.

**Current Status:** Phases 1-4 complete, Phase 5 in progress. See `scripts/ralph/prd.json` for user stories.

## Commands

```bash
bun dev              # Start dev server on localhost:3000
bun run build        # Production build
bun run lint         # ESLint
bun run db:push      # Push schema changes to database (no migration files)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio (DB GUI)
bun run db:seed      # Seed database with test data
```

All `db:*` commands load env from `.env.local` via `dotenv-cli`.

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Styling**: Tailwind CSS 4 with shadcn/ui (new-york style)
- **Database**: Drizzle ORM with Neon serverless Postgres
- **File Storage**: Vercel Blob (production), local `public/uploads/` (dev — auto-detected when `BLOB_READ_WRITE_TOKEN` is absent)
- **Auth**: JWT sessions via `jose` + `bcryptjs`, stored in httpOnly cookie named `session`
- **Package Manager**: Bun

## Environment Variables

Set in `.env.local`:
- `POSTGRES_URL` — Neon Postgres connection string (required)
- `AUTH_SECRET` — JWT signing secret (falls back to a default in dev)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (optional; without it, PDFs save to `public/uploads/`)

## Architecture

### Auth Flow
`middleware.ts` intercepts all requests. Public paths (`/login`, `/api/auth/*`) pass through; all others require a valid JWT cookie. The cookie is verified with `jose` in middleware, then `lib/auth.ts:getCurrentUser()` (wrapped in `React.cache()` for request deduplication) fetches the full user from DB in server components/API routes.

**Login is password-only** (no usernames) — `verifyPassword()` checks the input against every active user's bcrypt hash until a match.

### Version Status Workflow
Defined in `lib/permissions.ts`. Versions follow: **Draft → In Review → Approved → Live → Archived**. Each transition has role restrictions:
- Admin: all transitions
- Approver: In Review → Approved only
- Designer/Reviewer/Contributor: no status changes

Side effect: when a version goes Live, the API (`app/api/versions/[id]/status/route.ts`) auto-archives any other live version of the same menu.

### Database
Schema in `lib/db/schema.ts`, connection in `lib/db/index.ts`. Uses Neon's HTTP driver (not WebSocket). All tables use UUID primary keys. Import everything from `@/lib/db` (re-exports schema).

### Batch Fetching Pattern
Avoid N+1 queries — fetch main records, collect IDs, then batch-fetch related data with `inArray()`:
```typescript
const menuIds = result.map(m => m.id);
const tagResults = await db.select().from(menuTags).where(inArray(menuTags.menuId, menuIds));
```

### PDF Viewer + Annotations
`components/pdf-viewer.tsx` renders PDFs using `react-pdf`. Annotation system overlays a canvas (`components/annotation-canvas.tsx`) with tools (pen, text, checkmark, highlight) managed by `components/annotation-toolbar.tsx`. Annotations stored as vector JSON in `annotations` table, scoped per version + page.

## Design Guidelines

- **Background**: Warm cream `#FAF7F2`
- **Text**: Deep brown `#3D2E2E`
- **Accent**: Coral `#E07A5F`
- **Status colors**: Draft `#9CA3AF`, In Review `#F59E0B`, Approved `#10B981`, Live `#E07A5F`

## User Roles

- **Admin**: Full access, all status transitions, user/category/tag management
- **Designer**: View only, can annotate, no status changes
- **Approver**: Can annotate, can approve (In Review → Approved)
- **Reviewer**: View only, can comment
- **Contributor**: View only

## Test Users

From `scripts/seed.ts` — login uses password only (no username field):
- Dylan (admin): "dylan"
- Raffy (designer): "raffy"
- Ludo (approver): "ludo"
- Amélie (reviewer): "amelie"

## Code Quality

- Run `bun run build && bun run lint` before committing
- One logical change per commit
- Follow existing patterns in codebase

## Ralph Loop (Autonomous Coding)

```bash
./scripts/ralph/ralph-once.sh    # Single iteration
./scripts/ralph/ralph.sh 10      # Run 10 iterations
```

See `scripts/ralph/prompt.md` for instructions, `scripts/ralph/progress.txt` for history.
