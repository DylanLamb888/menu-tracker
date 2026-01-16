# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Menu version control system for La Maison Ani London restaurant. Centralizes menu PDF management with version trees, approval workflows, role-based access, and WhatsApp notifications. See `lma-menu-version-control-prd.md` for full requirements.

## Commands

```bash
bun dev          # Start development server on localhost:3000
bun run build    # Production build
bun run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Styling**: Tailwind CSS 4 with shadcn/ui (new-york style)
- **Package Manager**: Bun (preferred) or npm
- **Deployment Target**: Vercel

## Project Structure

```
app/           # Next.js App Router pages and layouts
lib/           # Utilities (cn() for className merging)
components/    # React components (shadcn/ui goes in components/ui/)
```

## Path Aliases

`@/*` maps to the project root. Use `@/components`, `@/lib`, etc.

## Planned Architecture (from PRD)

- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob (for PDF uploads)
- **Notifications**: Twilio WhatsApp API
- **Auth**: Simple password-based (no email/username)

### Data Model (key entities)

- USER (roles: admin, designer, approver, reviewer, contributor)
- MENU (with categories and tags)
- VERSION (status workflow: Draft → In Review → Approved → Live → Archived)
- COMMENT (with @mentions and categories)
- ACTIVITY_LOG

### API Routes Pattern

```
/api/auth/*           # Authentication
/api/menus/*          # Menu CRUD
/api/menus/:id/versions  # Version management
/api/versions/:id/*   # Version details, comments
/api/activity         # Activity log
/api/users            # User management (admin)
/api/settings         # App settings (admin)
```

## Design Guidelines

- Color palette: Warm cream (#FAF7F2), coral accent (#E07A5F), deep brown text (#3D2E2E)
- Status colors: Draft (grey #9CA3AF), In Review (amber #F59E0B), Approved (green #10B981), Live (coral #E07A5F)
- Typography: Inter for UI, JetBrains Mono for version labels
- Mobile-first responsive design

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Code Quality

This is production code for a real business. Must be maintainable long-term.

- Run all feedback loops before committing: `bun run build` and `bun run lint`
- Keep changes small and focused - one logical change per commit
- Prefer multiple small commits over one large commit

## Task Prioritization

When choosing what to work on, prioritize in this order:

1. Architectural decisions and core abstractions
2. Integration points between modules
3. Unknown unknowns and spike work
4. Standard features and implementation
5. Polish, cleanup, and quick wins

## Ralph Loop (Autonomous Coding)

Scripts in `scripts/ralph/` for autonomous task execution:

```bash
./scripts/ralph/ralph-once.sh    # Single iteration, human-in-the-loop
./scripts/ralph/ralph.sh 10      # Run 10 iterations autonomously
```

**Key files:**
- `prd.json` - User stories with `passes: boolean` status
- `prompt.md` - Instructions given to each iteration
- `progress.txt` - Learnings and completed work log

**Workflow per iteration:**
1. Read `prd.json` and `progress.txt` (check Codebase Patterns first)
2. Pick highest priority story where `passes: false`
3. Implement the story
4. Run feedback loops: `bun run build && bun run lint`
5. Commit with message: `feat: [Story ID] - [Story Title]`
6. Update `prd.json` to set `passes: true`
7. Append learnings to `progress.txt`

**Stop condition:** When all stories have `passes: true`, output `<promise>COMPLETE</promise>`

## Progress Tracking

When working in a Ralph loop:

- Check `## Codebase Patterns` section at TOP of `progress.txt` before starting
- Append completed work with: what was done, files changed, learnings
- Add reusable patterns to the Codebase Patterns section
- Update this CLAUDE.md file if you discover important conventions
