# Product Requirements Document
## LMA Menu Version Control System

**Version:** 1.0  
**Date:** 16 January 2026  
**Author:** Dylan (Marketing and Social Media Coordinator)  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Problem Statement

La Maison Ani London's menu revision process suffers from fragmented communication, unclear version status, and lack of accountability. Menus are managed across WhatsApp, email, Canva, and PDFs with no single source of truth. This creates:

- Version confusion between stakeholders
- Designer (Raffy) working from outdated briefs or conflicting feedback
- No clear audit trail for approvals
- Errors reaching print due to missed review steps
- Wasted time chasing updates across channels

### 1.2 Solution

A web-based menu version control system that provides:

- Centralised storage of all menu PDFs
- Visual version tree showing revision history and branches
- Structured comments with role-based notifications
- Clear status workflow with enforced approval gates
- Full audit trail of all activity
- WhatsApp notifications for key events

### 1.3 Success Criteria

- Single source of truth for all menu versions
- Zero menus printed without recorded approval
- Designer has clear visibility of current approved content and pending feedback
- Full traceability of who changed what, when, and why
- Reduced WhatsApp noise for menu coordination

---

## 2. Users and Personas

### 2.1 User Roles

| Role | User(s) | Primary Use |
|------|---------|-------------|
| Admin | Dylan | Full control: upload, status changes, settings, user management |
| Designer | Raffy | Upload revised PDFs, view feedback, mark work complete |
| Approver | Ludo | Review versions, approve for print, comment |
| Reviewer | Amélie | Design/brand oversight, comment on major revisions |
| Contributor | Chef, Joao, others | Initiate change requests, comment, view |

### 2.2 Permission Matrix

| Action | Admin (Dylan) | Designer (Raffy) | Approver (Ludo) | Reviewer (Amélie) | Contributor |
|--------|---------------|------------------|-----------------|-------------------|-------------|
| View all menus | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload new version | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change status (all) | ✓ | ✗ | ✗ | ✗ | ✗ |
| Mark as Approved | ✓ | ✗ | ✓ | ✗ | ✗ |
| Add comments | ✓ | ✓ | ✓ | ✓ | ✓ |
| @mention users | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign version | ✓ | ✗ | ✗ | ✗ | ✗ |
| Download PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export history | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| Reset passwords | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## 3. Functional Requirements

### 3.1 Authentication

**FR-AUTH-01:** Simple password-based authentication  
- Each user has a unique, simple password (e.g., their name)
- No email/username required
- System identifies user by password

**FR-AUTH-02:** Password management  
- Admin can reset any user's password
- Admin can add new users
- Admin can deactivate users

**FR-AUTH-03:** Session handling  
- Sessions persist for 30 days
- No complex logout requirements

---

### 3.2 Dashboard

**FR-DASH-01:** Menu overview  
- Display all menus with current status
- Show: menu name, category, current live version, in-progress version (if any), last updated date

**FR-DASH-02:** Status indicators  
- Visual status badges: Draft, In Review, Approved, Live, Archived
- Colour-coded for quick scanning

**FR-DASH-03:** Filtering  
- Filter by category (À La Carte, Breakfast, Drinks, Wine, Dessert)
- Filter by tag (Seasonal, Event-specific, Standard)
- Filter by status

**FR-DASH-04:** Search  
- Search by menu name
- Search by date range
- Search by uploader

**FR-DASH-05:** Attention required  
- Visual indicator for items needing user's action
- Based on assignment or @mention

---

### 3.3 Menu Management

**FR-MENU-01:** Menu creation  
- Create new menu with name, category, and tags
- Categories: À La Carte, Breakfast, Drinks, Wine, Dessert (configurable)
- Tags: Seasonal, Event-specific, Standard (configurable)

**FR-MENU-02:** Menu metadata  
- Edit menu name, category, tags
- View creation date, creator
- View total version count

**FR-MENU-03:** Menu archival  
- Configurable auto-archive period (default: 6 months)
- Archived menus accessible via archive view
- Manual archive option

---

### 3.4 Version Tree

**FR-TREE-01:** Visual tree structure  
- Display version history as a tree/graph
- Show branching where versions diverge
- Clear parent-child relationships

**FR-TREE-02:** Version nodes  
- Each node shows: version number, status, date, uploader thumbnail
- Click to expand/view details

**FR-TREE-03:** Live version indicator  
- Clear visual distinction for the current live version
- Only one version can be Live per menu at any time

**FR-TREE-04:** Branch creation  
- Create new branch from any existing version
- Name/label branches (e.g., "Valentine's Day variant")

---

### 3.5 Version Management

**FR-VER-01:** Version creation  
- Upload PDF file
- Required fields: reason for change, what changed (free text)
- Optional: item-level changes (structured)

**FR-VER-02:** Item-level change log  
- Add individual item changes: item name, old value, new value
- Example: "Truffle tart", "£36", "£38"
- Multiple items per version

**FR-VER-03:** Version metadata  
- Uploader name and timestamp
- Parent version reference
- Reason for change
- Status
- Assignment (who's responsible)

**FR-VER-04:** Status workflow  
States: Draft → In Review → Approved → Live → Archived

| Transition | Who Can Do It |
|------------|---------------|
| Draft → In Review | Admin |
| In Review → Draft (rejection) | Admin |
| In Review → Approved | Admin, Approver (Ludo) |
| Approved → Live | Admin |
| Live → Archived | Automatic (when new version goes Live) or Admin |
| Any → Archived | Admin |

**FR-VER-05:** Version assignment  
- Assign a version to a specific user
- Indicates "their turn" to act
- Triggers notification

**FR-VER-06:** PDF viewer  
- View PDF inline without downloading
- Basic zoom and page navigation

**FR-VER-07:** PDF download  
- Download PDF directly from version view

---

### 3.6 Comments

**FR-COM-01:** Add comments  
- Text comment on any version
- Required: category (Content, Design, Pricing, Other)
- Timestamps automatically

**FR-COM-02:** @mentions  
- Tag users with @name syntax
- Autocomplete user names
- Tagged user receives notification

**FR-COM-03:** Comment display  
- Chronological list on version detail
- Show: author, timestamp, category badge, content
- Show @mentions as highlighted

**FR-COM-04:** Comment notifications  
- New comment triggers notification to version uploader
- @mention triggers notification to mentioned user

---

### 3.7 Activity Log

**FR-ACT-01:** Track all actions  
- Version created
- Version status changed
- Comment added
- PDF downloaded
- PDF viewed
- Version assigned
- User logged in

**FR-ACT-02:** Activity display  
- Filterable by version, user, action type, date range
- Chronological feed

**FR-ACT-03:** Export activity  
- Export activity log as CSV

---

### 3.8 Notifications (WhatsApp)

**FR-NOT-01:** Notification events  
- New version uploaded
- Comment added
- Status changed
- @mentioned
- Assigned to version

**FR-NOT-02:** Role-based filtering  

| User | Receives Notifications For |
|------|---------------------------|
| Dylan (Admin) | All events |
| Raffy (Designer) | Assigned to him, @mentioned, feedback on his uploads |
| Ludo (Approver) | Approval requests, @mentioned, status changes to Live |
| Amélie (Reviewer) | Major revisions only, design checkpoint comments, @mentioned |
| Contributors | @mentioned, assigned |

**FR-NOT-03:** Notification content  
- Menu name
- Action taken
- By whom
- Link to view in system

**FR-NOT-04:** Notification settings  
- Admin can configure phone numbers per user
- Users cannot self-configure (keeps it simple)

---

### 3.9 Export and Reporting

**FR-EXP-01:** Download PDF  
- Download current version PDF

**FR-EXP-02:** Export menu history  
- Generate report of all versions for a menu
- Include: version number, date, uploader, status, change summary, item changes
- Format: PDF or CSV

**FR-EXP-03:** Export activity log  
- Export filtered activity as CSV

---

### 3.10 Settings (Admin Only)

**FR-SET-01:** User management  
- Add new user (name, role, password, phone number)
- Edit user details
- Reset user password
- Deactivate user

**FR-SET-02:** Category management  
- Add/edit/remove menu categories

**FR-SET-03:** Tag management  
- Add/edit/remove menu tags

**FR-SET-04:** Archive settings  
- Configure auto-archive period (months)

**FR-SET-05:** Notification settings  
- Configure which events trigger notifications per role

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-PERF-01:** Page load under 2 seconds on 4G connection  
**NFR-PERF-02:** PDF upload completes within 10 seconds for files up to 20MB  
**NFR-PERF-03:** Support up to 50 menus with 100 versions each without degradation

### 4.2 Security

**NFR-SEC-01:** All traffic over HTTPS  
**NFR-SEC-02:** Passwords stored hashed (not plain text)  
**NFR-SEC-03:** PDF URLs not guessable (signed URLs or similar)  
**NFR-SEC-04:** Session tokens expire after 30 days of inactivity

### 4.3 Availability

**NFR-AVA-01:** 99% uptime (acceptable for internal tool)  
**NFR-AVA-02:** Vercel's standard availability guarantees

### 4.4 Usability

**NFR-USA-01:** Mobile responsive, functional on phones  
**NFR-USA-02:** No training required for basic viewing and commenting  
**NFR-USA-03:** Accessible colour contrast ratios

### 4.5 Data

**NFR-DAT-01:** Daily database backups  
**NFR-DAT-02:** PDF storage with redundancy (Vercel Blob default)  
**NFR-DAT-03:** No data deletion without admin action (except auto-archive, which preserves data)

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (React, App Router) |
| Backend | Next.js API Routes |
| Database | Vercel Postgres |
| File Storage | Vercel Blob |
| Notifications | Twilio WhatsApp API |
| Hosting | Vercel |
| Authentication | Custom simple auth (password-based) |

### 5.2 Data Model

```
USER
├── id (uuid, primary key)
├── name (string, unique)
├── password_hash (string)
├── role (enum: admin, designer, approver, reviewer, contributor)
├── phone_number (string, for WhatsApp)
├── is_active (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)

MENU
├── id (uuid, primary key)
├── name (string)
├── category_id (foreign key → CATEGORY)
├── created_by (foreign key → USER)
├── created_at (timestamp)
├── updated_at (timestamp)
└── is_archived (boolean)

MENU_TAG (junction table)
├── menu_id (foreign key → MENU)
└── tag_id (foreign key → TAG)

CATEGORY
├── id (uuid, primary key)
├── name (string)
└── sort_order (integer)

TAG
├── id (uuid, primary key)
├── name (string)
└── colour (string, hex code)

VERSION
├── id (uuid, primary key)
├── menu_id (foreign key → MENU)
├── parent_version_id (foreign key → VERSION, nullable)
├── version_label (string, e.g., "Jan 2026 Rev A")
├── status (enum: draft, in_review, approved, live, archived)
├── pdf_url (string, Vercel Blob URL)
├── pdf_filename (string)
├── reason_for_change (text)
├── change_summary (text)
├── uploaded_by (foreign key → USER)
├── assigned_to (foreign key → USER, nullable)
├── approved_by (foreign key → USER, nullable)
├── approved_at (timestamp, nullable)
├── went_live_at (timestamp, nullable)
├── archived_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)

ITEM_CHANGE
├── id (uuid, primary key)
├── version_id (foreign key → VERSION)
├── item_name (string)
├── old_value (string)
├── new_value (string)
└── created_at (timestamp)

COMMENT
├── id (uuid, primary key)
├── version_id (foreign key → VERSION)
├── author_id (foreign key → USER)
├── category (enum: content, design, pricing, other)
├── content (text)
├── created_at (timestamp)
└── updated_at (timestamp)

COMMENT_MENTION (junction table)
├── comment_id (foreign key → COMMENT)
└── user_id (foreign key → USER)

ACTIVITY_LOG
├── id (uuid, primary key)
├── user_id (foreign key → USER)
├── action (enum: version_created, status_changed, comment_added, pdf_downloaded, pdf_viewed, version_assigned, user_logged_in)
├── target_type (enum: version, menu, user, comment)
├── target_id (uuid)
├── metadata (jsonb, additional context)
├── created_at (timestamp)

SETTINGS
├── key (string, primary key)
└── value (jsonb)
```

### 5.3 Key API Endpoints

```
Authentication
POST   /api/auth/login          - Login with password
POST   /api/auth/logout         - End session
GET    /api/auth/me             - Get current user

Menus
GET    /api/menus               - List all menus (with filters)
POST   /api/menus               - Create menu
GET    /api/menus/:id           - Get menu with version tree
PATCH  /api/menus/:id           - Update menu metadata
DELETE /api/menus/:id           - Archive menu

Versions
GET    /api/menus/:id/versions  - List versions for menu
POST   /api/menus/:id/versions  - Create new version (with PDF upload)
GET    /api/versions/:id        - Get version details
PATCH  /api/versions/:id        - Update version (status, assignment)
POST   /api/versions/:id/items  - Add item-level change

Comments
GET    /api/versions/:id/comments - List comments on version
POST   /api/versions/:id/comments - Add comment

Activity
GET    /api/activity            - List activity (with filters)
GET    /api/activity/export     - Export activity as CSV

Users (Admin only)
GET    /api/users               - List users
POST   /api/users               - Create user
PATCH  /api/users/:id           - Update user
POST   /api/users/:id/reset-password - Reset password

Settings (Admin only)
GET    /api/settings            - Get all settings
PATCH  /api/settings/:key       - Update setting

Categories (Admin only)
GET    /api/categories          - List categories
POST   /api/categories          - Create category
PATCH  /api/categories/:id      - Update category
DELETE /api/categories/:id      - Delete category

Tags (Admin only)
GET    /api/tags                - List tags
POST   /api/tags                - Create tag
PATCH  /api/tags/:id            - Update tag
DELETE /api/tags/:id            - Delete tag

Export
GET    /api/menus/:id/export    - Export menu history as PDF/CSV
```

### 5.4 WhatsApp Integration

Using Twilio WhatsApp API:

1. Register Twilio account with WhatsApp sender
2. Store user phone numbers in USER table
3. On notification event:
   - Check user's role-based notification preferences
   - If should notify, call Twilio API
   - Log notification in ACTIVITY_LOG

Message template:
```
🍽️ LMA Menu Update

{action} on {menu_name}
By: {user_name}
Status: {status}

View: {url}
```

---

## 6. Design Specifications

### 6.1 Design Principles

- **Clean and minimal:** Inspired by Linear's information density and clarity
- **Warm brand alignment:** LMA colour palette (cream, coral, warm tones)
- **Mobile-first responsive:** Works fully on phones, optimised for desktop
- **Status clarity:** Instant visual recognition of version states
- **Reduced cognitive load:** Show only what's needed for the current task

### 6.2 Colour Palette

| Use | Colour | Hex |
|-----|--------|-----|
| Background (primary) | Warm cream | #FAF7F2 |
| Background (secondary) | Soft white | #FFFFFF |
| Text (primary) | Deep brown | #3D2E2E |
| Text (secondary) | Muted brown | #7A6B6B |
| Accent (primary) | Coral | #E07A5F |
| Accent (secondary) | Soft coral | #F2C4B6 |
| Status: Draft | Grey | #9CA3AF |
| Status: In Review | Amber | #F59E0B |
| Status: Approved | Green | #10B981 |
| Status: Live | Coral (brand) | #E07A5F |
| Status: Archived | Light grey | #D1D5DB |

### 6.3 Typography

| Use | Font | Size | Weight |
|-----|------|------|--------|
| Headings | Inter | 24-32px | 600 |
| Subheadings | Inter | 18-20px | 500 |
| Body | Inter | 14-16px | 400 |
| Labels | Inter | 12-14px | 500 |
| Monospace (versions) | JetBrains Mono | 13px | 400 |

### 6.4 Key Screens

**Dashboard**
- Header: Logo, search bar, user menu
- Filters: Category pills, tag pills, status dropdown
- Menu grid/list: Cards showing menu name, current status, last updated, attention indicator
- Quick actions: Create new menu button

**Menu Detail / Version Tree**
- Breadcrumb: Dashboard > Menu Name
- Menu header: Name, category badge, tags
- Version tree: Visual graph of versions with status colours
- Selected version panel: Details, comments, actions

**Version Detail**
- Version header: Label, status badge, assigned user
- PDF preview: Embedded viewer
- Metadata: Uploader, date, reason, item changes
- Comments: Threaded list with category badges
- Actions: Change status, assign, download

**Settings (Admin)**
- Tabs: Users, Categories, Tags, Archive, Notifications
- Forms for each setting type

### 6.5 Component Library

Build with:
- Tailwind CSS for styling
- Headless UI or Radix for accessible components
- React PDF for PDF viewing
- D3 or React Flow for version tree visualisation

---

## 7. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

- Project setup (Next.js, Vercel, Postgres)
- Database schema and migrations
- Authentication system
- Basic API endpoints (CRUD for menus, versions)
- PDF upload to Vercel Blob

**Deliverable:** Can login, create menus, upload versions

### Phase 2: Version Management (Week 3-4)

- Version tree visualisation
- Status workflow enforcement
- Item-level change tracking
- PDF viewer integration
- Version assignment

**Deliverable:** Full version lifecycle management

### Phase 3: Collaboration (Week 5-6)

- Comments system
- @mentions
- Activity logging
- Search and filtering

**Deliverable:** Team can collaborate on versions

### Phase 4: Notifications and Polish (Week 7-8)

- Twilio WhatsApp integration
- Role-based notification routing
- Export functionality
- Settings management
- Mobile responsiveness
- UI polish

**Deliverable:** Production-ready system

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Twilio WhatsApp approval delays | Medium | Medium | Start approval process early; have email fallback |
| PDF viewer performance on mobile | Medium | Low | Use lazy loading; provide download as alternative |
| Team adoption resistance | Low | High | Keep UI simple; involve Raffy in testing early |
| Version tree complexity for many branches | Low | Medium | Implement collapsible branches; archive old versions |
| Vercel costs exceed free tier | Low | Low | Monitor usage; upgrade to Pro if needed (~$20/month) |

---

## 9. Out of Scope (Future Considerations)

- Automated PDF comparison/diff
- Integration with Canva API
- POS system integration
- Public-facing menu hosting
- Multi-restaurant support
- AI-powered menu validation (brand voice, allergen checking)
- Email notifications (WhatsApp only for now)
- Offline support

---

## 10. Acceptance Criteria

### Minimum Viable Product (MVP)

The system is ready for production when:

1. ✓ Users can log in with simple passwords
2. ✓ Admin can manage users and reset passwords
3. ✓ Menus can be created with categories and tags
4. ✓ PDF versions can be uploaded with metadata
5. ✓ Version tree displays correctly with branching
6. ✓ Status workflow is enforced (only permitted users can change status)
7. ✓ Comments can be added with categories and @mentions
8. ✓ Activity log tracks all actions
9. ✓ WhatsApp notifications deliver to correct users
10. ✓ PDFs can be viewed and downloaded
11. ✓ Menu history can be exported
12. ✓ System works on mobile devices

---

## Appendix A: User Stories

**As Dylan (Admin), I want to:**
- See all menus and their current status at a glance
- Upload a new menu version when Raffy sends a PDF
- Move versions through the approval workflow
- Assign a version to Raffy for revisions
- Leave comments with specific feedback
- See who did what and when
- Get notified of all activity

**As Raffy (Designer), I want to:**
- See exactly which version is current and approved
- Know what feedback I need to address
- Upload my revised PDFs
- Know when my work is approved or needs more changes
- Not get notifications about things that don't concern me

**As Ludo (Approver), I want to:**
- See versions waiting for my approval
- Review the PDF and any comments
- Approve versions for print
- Leave comments if something needs changing
- Not have to learn a complex system

**As Amélie (Reviewer), I want to:**
- Check design compliance on major revisions
- Leave feedback on brand alignment
- Not be bothered with every small change

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Menu | A document type (e.g., À La Carte, Breakfast) |
| Version | A specific revision of a menu, represented as a PDF |
| Version Tree | Visual representation of how versions relate and branch |
| Status | Current state of a version (Draft, In Review, Approved, Live, Archived) |
| Assignment | Indicating which user is responsible for acting on a version |
| Item Change | A specific modification (e.g., price change for one dish) |

---

*End of document*
