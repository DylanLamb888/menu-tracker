# Menu Tracker MVP Implementation Spec

## Overview

Building the foundation for LMA Menu Version Control System. This spec covers the MVP phase (5 user stories) that establishes auth, dashboard, and core version workflow.

## Current State

- ✅ Database schema complete (`lib/db/schema.ts`) - 12 tables, all types exported
- ✅ Drizzle ORM configured with Vercel Postgres
- ✅ Ralph automation infrastructure ready
- ❌ No UI components (still Create Next App boilerplate)
- ❌ No API routes
- ❌ Missing dependencies: shadcn/ui, bcrypt, @vercel/blob

## Architecture Decisions

### Authentication
- **Method**: Password-only (each user has unique password that identifies them)
- **Flow**: User enters password → lookup in DB → if found, create session
- **Session**: HTTP-only cookie, 30-day expiry
- **Security**: Passwords hashed with bcrypt (NFR-SEC-02)

### Tech Stack
- **ORM**: Drizzle with Vercel Postgres
- **UI**: shadcn/ui (new-york style) with Tailwind CSS 4
- **File Storage**: Vercel Blob for PDFs
- **Auth**: Custom middleware with encrypted cookies

## Pre-Implementation Setup

Before starting stories, install missing dependencies:

```bash
# UI components
bunx shadcn@latest add button card badge input label

# Auth & security
bun add bcryptjs
bun add -d @types/bcryptjs

# File storage (for US-004)
bun add @vercel/blob
```

## MVP User Stories

### US-001: Database Schema Setup ✅ COMPLETE

### US-002: Simple Password Authentication

**Files to create/modify:**
- `app/login/page.tsx` - Login page with password input
- `app/api/auth/login/route.ts` - POST endpoint for login
- `app/api/auth/logout/route.ts` - POST endpoint for logout
- `app/api/auth/me/route.ts` - GET current user
- `lib/auth.ts` - Session helpers (encrypt/decrypt cookie, getCurrentUser)
- `middleware.ts` - Protect routes, redirect unauthenticated users

**Acceptance criteria:**
- [ ] Login page with single password field
- [ ] Password lookup returns user or error
- [ ] Session cookie set on successful login (30-day expiry)
- [ ] Protected routes redirect to /login if no session
- [ ] `/api/auth/me` returns current user data
- [ ] Logout clears session

**Implementation notes:**
- Use `jose` for JWT in cookie (lightweight, edge-compatible)
- Middleware checks cookie on all routes except /login and /api/auth/*
- Seed script to create initial users with hashed passwords

### US-003: Dashboard Menu List

**Files to create/modify:**
- `app/page.tsx` - Replace boilerplate with dashboard
- `app/layout.tsx` - Add app shell (sidebar, header)
- `components/menu-card.tsx` - Card displaying menu info
- `components/status-badge.tsx` - Colored status badges
- `components/app-shell.tsx` - Layout wrapper with navigation
- `app/api/menus/route.ts` - GET all menus, POST create menu

**Acceptance criteria:**
- [ ] Dashboard shows grid of menu cards
- [ ] Each card shows: name, category, current status, last updated
- [ ] Status badges color-coded per design spec
- [ ] Empty state if no menus
- [ ] "New Menu" button (functionality can be placeholder)

**Design tokens:**
- Background: #FAF7F2 (warm cream)
- Text: #3D2E2E (deep brown)
- Status Draft: #9CA3AF
- Status In Review: #F59E0B
- Status Approved: #10B981
- Status Live: #E07A5F

### US-004: PDF Upload for Versions

**Files to create/modify:**
- `app/menus/[id]/page.tsx` - Menu detail page
- `app/menus/[id]/new-version/page.tsx` - Upload form
- `app/api/menus/[id]/versions/route.ts` - POST create version with PDF
- `components/pdf-upload.tsx` - File upload component
- `components/version-list.tsx` - List of versions for a menu
- `lib/blob.ts` - Vercel Blob upload helpers

**Acceptance criteria:**
- [ ] Menu detail page shows existing versions
- [ ] "New Version" button opens upload form
- [ ] Form: PDF file input, reason for change, change summary
- [ ] PDF uploaded to Vercel Blob, URL stored in version record
- [ ] New version created with status "draft"
- [ ] Redirect to menu detail after successful upload

### US-005: Version Status Workflow

**Files to create/modify:**
- `app/api/versions/[id]/route.ts` - PATCH to update version
- `app/api/versions/[id]/status/route.ts` - POST to change status
- `components/version-card.tsx` - Version display with status actions
- `components/status-actions.tsx` - Buttons for status transitions
- `lib/permissions.ts` - Role-based permission checks

**Acceptance criteria:**
- [ ] Version cards show current status
- [ ] Status change buttons based on user role:
  - Admin: all transitions
  - Approver: In Review → Approved
  - Designer: can view only
- [ ] Draft → In Review → Approved → Live flow works
- [ ] When version goes Live, previous Live version archived
- [ ] Activity log entry created on status change

**Status transitions:**
```
Draft → In Review (Admin only)
In Review → Draft (Admin only, rejection)
In Review → Approved (Admin, Approver)
Approved → Live (Admin only)
Live → Archived (automatic when new Live, or Admin manual)
```

## Verification Plan

After each story, verify:

1. **US-002**:
   - Can log in with valid password
   - Invalid password shows error
   - Session persists across page refresh
   - Logout works and redirects to login

2. **US-003**:
   - Dashboard loads after login
   - Create a menu via API/studio, verify it appears
   - Status badges show correct colors

3. **US-004**:
   - Upload a PDF, verify it appears in Vercel Blob dashboard
   - Version record created with correct PDF URL
   - Can view PDF URL (download works)

4. **US-005**:
   - Create version, status is "draft"
   - Change status through workflow
   - Role restrictions enforced
   - Going Live archives previous Live version

## Files to Seed

Create `scripts/seed.ts` to populate initial data:
- Admin user (Dylan)
- Designer user (Raffy)
- Approver user (Ludo)
- Reviewer user (Amélie)
- Default categories (À La Carte, Breakfast, Drinks, Wine, Dessert)
- Default tags (Seasonal, Event-specific, Standard)

## Out of Scope for MVP

- Version tree visualization (Phase 2)
- Comments with @mentions (Phase 3)
- WhatsApp notifications (Phase 4)
- PDF inline viewer (Phase 2)
- Search and filtering (Phase 3)
- Activity log UI (Phase 3)
- Settings management UI (Phase 4)
