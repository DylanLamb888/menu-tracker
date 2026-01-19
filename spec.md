# Menu Tracker Implementation Spec

## Overview

Menu version control system for La Maison Ani London restaurant. This spec tracks implementation progress across all phases.

## Current State (as of 2026-01-19)

### Completed Phases

| Phase | Stories | Status |
|-------|---------|--------|
| Phase 1 | US-001 to US-005 | ✅ Complete |
| Phase 2 | US-006 to US-010 | ✅ Complete |
| Phase 3 | US-011 to US-014 | ✅ Complete |
| Phase 4 | US-015 to US-020 | ✅ Complete |
| Phase 5 | US-021 to US-024 | 🔄 In Progress |

### What's Built

- ✅ Database schema (Drizzle ORM + Vercel Postgres)
- ✅ Password-based authentication with JWT sessions
- ✅ Dashboard with menu cards, search, filters
- ✅ PDF upload to Vercel Blob
- ✅ Version status workflow (Draft → In Review → Approved → Live)
- ✅ Version detail page with inline PDF viewer
- ✅ Version timeline/tree view
- ✅ Comments on versions (with categories)
- ✅ Activity log with filters and export
- ✅ Admin settings (users, categories, tags management)
- ✅ CSV exports for menu history and activity
- ✅ Tags on menus (assign at creation, display on cards)

## Phase 5: Annotations & Polish

### US-021: PDF Canvas Annotation System (PRIORITY)

**User Need:** Raffy (designer) marks up menu PDFs with visual annotations - checkmarks, strikethroughs, text notes, year/price corrections. Currently does this on paper or in Preview.app.

**Reference:** Wine list PDF with manual markup showing:
- ✓ Blue checkmarks for approved items
- Strikethrough old values with new values nearby (2023 → 2024)
- "to be removed" text annotations
- Highlight boxes around changes
- Bracket grouping for related items

**Technical Approach:**

1. **Database Schema**
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  version_id UUID REFERENCES versions(id),
  page_number INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'pen', 'text', 'checkmark', 'highlight'
  data JSONB NOT NULL,        -- {paths, position, color, text, etc}
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Canvas Overlay**
- Add `<canvas>` on top of PDF in `components/pdf-viewer.tsx`
- Canvas matches PDF dimensions, positioned absolutely
- Capture mouse/touch events for drawing

3. **Drawing Tools**
- Pen: Freehand paths, variable colors
- Text: Click to place, type text
- Checkmark: Stamp at click position
- Highlight: Rectangle with transparent fill

4. **Data Format** (JSON in `data` column)
```typescript
// Pen stroke
{ type: 'pen', color: '#0000FF', paths: [[x1,y1], [x2,y2], ...] }

// Text annotation
{ type: 'text', color: '#FF0000', position: {x, y}, text: 'to be removed' }

// Checkmark
{ type: 'checkmark', color: '#0000FF', position: {x, y} }

// Highlight
{ type: 'highlight', color: '#FFFF00', rect: {x, y, width, height} }
```

5. **API Endpoints**
```
GET  /api/versions/[id]/annotations        # List annotations for version
POST /api/versions/[id]/annotations        # Create annotation
DELETE /api/versions/[id]/annotations/[aid] # Delete annotation
```

6. **UI Components**
- `components/annotation-toolbar.tsx` - Tool selection, color picker
- `components/annotation-canvas.tsx` - Canvas drawing logic
- Integrate into existing `components/pdf-viewer.tsx`

**Files to create:**
- `lib/db/schema.ts` - Add annotations table
- `app/api/versions/[id]/annotations/route.ts`
- `components/annotation-toolbar.tsx`
- `components/annotation-canvas.tsx`

**Files to modify:**
- `components/pdf-viewer.tsx` - Add canvas overlay

### US-022: Edit Tags on Existing Menus

Currently tags can only be assigned at menu creation. Add ability to edit.

**Implementation:**
- Menu detail page shows current tags
- Edit button opens tag selection dialog (reuse from new menu form)
- PATCH `/api/menus/[id]` to update tagIds
- Delete old menuTags, insert new ones

### US-023: Tag Filtering on Dashboard

Add tag filter to existing dashboard filters.

**Implementation:**
- Fetch all tags for filter dropdown
- Add tag filter state to `dashboard-filters.tsx`
- Filter menus by selected tag(s)

### US-024: Mobile Responsive Polish

Ensure all pages work on mobile viewports.

**Key areas:**
- Dashboard grid → single column on mobile
- Navigation → hamburger menu or bottom nav
- PDF viewer → pinch to zoom, scroll
- Settings tabs → scrollable or stacked
- Forms → full width, proper touch targets

## Deferred Features

- **Twilio WhatsApp notifications** - User opted to skip for now
- **Email notifications** - Alternative to WhatsApp, not prioritized
- **Version branching** - Create version from non-latest version

## Test Accounts

| Name | Role | Password |
|------|------|----------|
| Dylan | Admin | dylan |
| Raffy | Designer | raffy |
| Ludo | Approver | ludo |
| Amélie | Reviewer | amelie |

## Key Files Reference

| Purpose | File |
|---------|------|
| Database schema | `lib/db/schema.ts` |
| Auth helpers | `lib/auth.ts` |
| Role permissions | `lib/permissions.ts` |
| PDF viewer | `components/pdf-viewer.tsx` |
| Dashboard filters | `components/dashboard-filters.tsx` |
| Menu card | `components/menu-card.tsx` |
| Settings page | `app/settings/page.tsx` |
| Activity log | `app/activity/page.tsx` |
