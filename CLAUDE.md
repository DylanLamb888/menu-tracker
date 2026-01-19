# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Menu version control system for La Maison Ani London restaurant. Centralizes menu PDF management with version trees, approval workflows, role-based access, and collaborative feedback.

**Current Status:** Phases 1-4 complete, Phase 5 in progress. See `scripts/ralph/prd.json` for user stories.

## Commands

```bash
bun dev          # Start development server on localhost:3000
bun run build    # Production build
bun run lint     # Run ESLint
bun run db:push  # Push schema changes to database
bun run db:generate  # Generate migrations
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Styling**: Tailwind CSS 4 with shadcn/ui (new-york style)
- **Database**: Drizzle ORM with Vercel Postgres (Neon)
- **File Storage**: Vercel Blob for PDFs
- **Package Manager**: Bun

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # API routes
    auth/               # Login, logout, me
    menus/              # Menu CRUD, versions, export
    versions/           # Version status, comments
    users/              # User management (admin)
    categories/         # Category management
    tags/               # Tag management
    activity/           # Activity log + export
  menus/[id]/           # Menu detail, new version
  settings/             # Admin settings (users, categories, tags)
components/             # React components
  ui/                   # shadcn/ui components
lib/
  db/                   # Drizzle schema and connection
  auth.ts               # Session management
  permissions.ts        # Role-based access
  blob.ts               # Vercel Blob helpers
scripts/
  ralph/               # Autonomous coding infrastructure
  seed.ts              # Database seeding
```

## Key Patterns

### Authentication
```typescript
import { getCurrentUser } from "@/lib/auth";
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### Database Queries
```typescript
import { db, menus, versions } from "@/lib/db";
import { eq, desc, inArray } from "drizzle-orm";
```

### Batch Fetching (avoid N+1)
```typescript
// Fetch main data first
const menuIds = result.map(m => m.id);
// Then batch fetch related data
const tagResults = await db.select().from(menuTags).where(inArray(menuTags.menuId, menuIds));
```

### CSV Export
```typescript
function escapeCSV(value: string | null): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

## Design Guidelines

- **Background**: Warm cream #FAF7F2
- **Text**: Deep brown #3D2E2E
- **Accent**: Coral #E07A5F
- **Status colors**:
  - Draft: Grey #9CA3AF
  - In Review: Amber #F59E0B
  - Approved: Green #10B981
  - Live: Coral #E07A5F

## User Roles

- **Admin**: Full access, all status transitions, user/category/tag management
- **Designer**: View only, no status changes
- **Approver**: Can approve (In Review → Approved)
- **Reviewer**: View only, can comment
- **Contributor**: View only

## Test Users

From `scripts/seed.ts`:
- Dylan (admin) - password: "dylan"
- Raffy (designer) - password: "raffy"
- Ludo (approver) - password: "ludo"
- Amélie (reviewer) - password: "amelie"

## Next Up: Phase 5

### US-021: PDF Canvas Annotation System (PRIORITY)

Raffy needs visual markup on PDFs. Reference: wine list with manual markup showing checkmarks, strikethroughs, "to be removed" notes, year/price changes.

**Implementation approach:**
1. Add `annotations` table to schema
2. Canvas overlay on existing PDF viewer (`components/pdf-viewer.tsx`)
3. Tools: pen (freehand), text, checkmark stamp, highlight
4. Store as vector data (JSON), render on PDF
5. API: GET/POST /api/versions/[id]/annotations

**Key files to modify:**
- `lib/db/schema.ts` - Add annotations table
- `components/pdf-viewer.tsx` - Add canvas overlay
- `app/api/versions/[id]/annotations/route.ts` - New API route

### Other Phase 5 stories:
- US-022: Edit tags on existing menus
- US-023: Tag filtering on dashboard
- US-024: Mobile responsive polish

## Code Quality

- Run `bun run build && bun run lint` before committing
- Keep changes focused - one logical change per commit
- Follow existing patterns in codebase

## Ralph Loop (Autonomous Coding)

```bash
./scripts/ralph/ralph-once.sh    # Single iteration
./scripts/ralph/ralph.sh 10      # Run 10 iterations
```

See `scripts/ralph/prompt.md` for instructions, `scripts/ralph/progress.txt` for history.
