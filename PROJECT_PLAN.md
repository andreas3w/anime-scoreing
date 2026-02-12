# Anime List Manager - Project Plan

## Overview

A self-hosted anime list management application that allows users to import their MyAnimeList exports, manage tags/categories, filter their collection, and track their anime watching progress.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS (TypeScript) |
| Frontend | React + TypeScript (Vite) |
| UI Components | Radix UI Primitives |
| Styling | Tailwind CSS |
| API Specification | OpenAPI 3.0 |
| Code Generation | openapi-generator (typescript-nestjs-server) |
| Database | SQLite |
| ORM | Prisma |
| Containerization | Docker Compose |

---

## Features

### Core Features (MVP)

- [x] **Import MAL XML** - Upload and parse MyAnimeList XML export files
- [ ] **Update Existing Data** - Re-import XML to update existing entries (merge by MAL ID)
- [ ] **Simple UI** - Clean, minimal interface for list management
- [ ] **Tagging System** - Create custom tags/categories for anime
- [ ] **Filtering** - Filter by tags, score, and status
- [ ] **Docker Compose** - One-command deployment

### Future Features

- [ ] **Fetch Anime Data** - Pull additional data from external APIs (Jikan/MAL)
- [ ] **Cover Images** - Display anime cover art
- [ ] **Statistics Dashboard** - Watch time, genre breakdown, score distribution
- [ ] **Export Functionality** - Export list in various formats
- [ ] **Dark/Light Theme** - Theme toggle support

---

## Database Schema

### Anime Table
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| malId | Int | MyAnimeList ID (unique) |
| title | String | Anime title |
| type | String | TV, Movie, OVA, Special, ONA |
| episodes | Int | Total episode count |
| myScore | Int | User score (1-10) |
| myWatchedEpisodes | Int | Episodes watched |
| myStartDate | DateTime | Date started watching |
| myFinishDate | DateTime | Date finished watching |
| myRewatching | Boolean | Currently rewatching |
| myRewatchingEp | Int | Rewatch episode count |
| myLastUpdated | DateTime | Last update timestamp |
| createdAt | DateTime | Record creation date |
| updatedAt | DateTime | Record update date |

### Tag Table
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Tag name (unique) |
| color | String | Hex color for UI display |
| isStatus | Boolean | If true, tag is a status tag (mutually exclusive) |

**Status Tags (seeded on first run):**
- Watching (blue)
- Completed (green)
- On-Hold (amber)
- Dropped (red)
- Plan to Watch (slate)

*Status tags are mutually exclusive - assigning one removes others.*

### AnimeTag Table (Junction)
| Field | Type | Description |
|-------|------|-------------|
| animeId | Int | Foreign key to Anime |
| tagId | Int | Foreign key to Tag |

---

## Project Structure

```
anime-scoring/
├── PROJECT_PLAN.md
├── .github/
│   └── copilot-instructions.md
├── docker-compose.yml
├── openapi/
│   └── spec.yaml                 # OpenAPI 3.0 specification
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── openapitools.json         # OpenAPI Generator config
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── generated/            # Auto-generated from OpenAPI
│       │   ├── api/              # Controllers (stubs)
│       │   └── model/            # DTOs/Models
│       ├── controllers/          # Controller implementations
│       │   ├── anime.controller.ts
│       │   ├── tags.controller.ts
│       │   └── import.controller.ts
│       ├── services/
│       │   ├── anime.service.ts
│       │   ├── tag.service.ts
│       │   └── xml-parser.service.ts
│       └── prisma/
│           └── prisma.service.ts
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── generated/            # Auto-generated API client
│       │   └── api/
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Badge.tsx
│       │   │   └── Input.tsx
│       │   ├── AnimeTable.tsx
│       │   ├── AnimeRow.tsx
│       │   ├── TagsCell.tsx
│       │   ├── TagEditor.tsx
│       │   ├── TagBadge.tsx
│       │   ├── FilterBar.tsx
│       │   └── ImportButton.tsx
│       ├── hooks/
│       │   ├── useAnime.ts
│       │   └── useRowEditState.ts
│       └── types/
│           └── index.ts
│
└── data/
    └── anime.db
```

---

## UI Architecture

### Design Philosophy
- **Single Page Application** - No routing, all content in one view
- **Table-centric** - Primary interface is a data grid (Radix Table)
- **Inline editing** - Edit mode within rows, no modal dialogs for CRUD
- **Batch operations** - Accumulate changes, commit on explicit save

### Component: AnimeTable

**Structure**
```
AnimeTable
├── TableHeader (sortable columns)
├── TableBody
│   └── AnimeRow (repeated)
│       ├── Cell: Title (read-only)
│       ├── Cell: Type (read-only)
│       ├── Cell: Score (read-only, from import)
│       ├── Cell: Episodes (read-only, progress)
│       ├── Cell: TagsCell
│       │   ├── StatusBadge (read-only, from import)
│       │   ├── TagBadge[] (display mode)
│       │   └── TagEditor (edit mode, custom tags only)
│       │       ├── TagBadge[] with RemoveButton (×)
│       │       └── TagInput (type + Enter to add)
│       └── Cell: RowActions
│           ├── EditButton (toggles edit mode)
│           ├── SaveButton (visible in edit mode)
│           └── CancelButton (visible in edit mode)
└── TableFooter (pagination, bulk actions)
```

**What's Editable:**
- ✅ Custom tags (`isStatus: false`) - add/remove in UI
- ❌ Status tag - set by import only
- ❌ Score - set by import only
- ❌ All other fields - set by import only

**Tag Types:**
- **Status tags** (`isStatus: true`): Read-only in UI, managed by import
- **Custom tags** (`isStatus: false`): User-editable in UI

### Row Edit Mode State Machine

```
┌─────────────┐
│  VIEW MODE  │ ◄─────────────────────────────┐
└──────┬──────┘                               │
       │ Click "Edit"                         │
       ▼                                      │
┌─────────────┐                               │
│  EDIT MODE  │                               │
│             │                               │
│ - Tags show × button                        │
│ - Tag input field visible                   │
│ - Pending changes accumulated               │
│   in local state (not persisted)            │
└──────┬──────┘                               │
       │                                      │
       ├── Click "Save" ──► API call ─────────┤
       │                    (batch update)    │
       │                                      │
       └── Click "Cancel" ──► Discard ────────┘
                              pending changes
```

### Tag Editing Behavior

| Action | Trigger | Effect |
|--------|---------|--------|
| Enter edit mode | Click row Edit button | Copy current custom tags to local state |
| Remove tag | Click × on TagBadge | Remove from local `currentTags` array |
| Add tag | Type in input + Enter | Add to local `currentTags` array |
| Commit changes | Click Save | POST final tag list, backend diffs & syncs |
| Discard changes | Click Cancel | Discard local state, revert to VIEW MODE |

**Note:** Status tags are displayed but NOT included in edit state. Backend ignores them.

### State Management (Per Row)

```typescript
interface RowEditState {
  isEditing: boolean;
  currentTags: string[];    // Current custom tag names (edited locally)
}
```

**On Edit:** Copy existing custom tags to `currentTags`
**On Add tag:** Push to `currentTags`
**On Remove tag:** Filter from `currentTags`
**On Save:** POST `{ tags: currentTags }` - backend diffs and syncs
**On Cancel:** Discard `currentTags`, exit edit mode

### Import Behavior (XML Upload)

**On import, for each anime entry:**
```
┌─────────────────────────────────────────────────────────────┐
│  XML Entry Found                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Anime exists in DB?        │
        │  (match by malId)           │
        └──────────────┬──────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │   NO    │                 │   YES   │
    └────┬────┘                 └────┬────┘
         │                           │
         ▼                           ▼
   CREATE new anime            UPDATE anime fields:
   with all fields             - title, type, episodes
   + status tag                - score, watched, dates
                               - (overwrite all)
                               
                               UPDATE status tag:
                               - Remove old status tag
                               - Add new status tag
                               
                               PRESERVE:
                               - Custom tags (untouched)
```

**Import Logic Summary:**
| Field Type | Create | Update |
|------------|--------|--------|
| Anime fields (title, score, etc.) | Set from XML | Overwrite from XML |
| Status tag | Set from XML status | Replace if changed |
| Custom tags | None | **Preserve** (no change) |

### Future: Anime Details Popup
- Triggered by clicking anime title or dedicated button
- Fetches additional data from external API (Jikan)
- Displays: cover image, synopsis, genres, studios
- **NOT in MVP** - placeholder for v2

---

## OpenAPI Code Generation

The API is defined in `openapi/spec.yaml` using OpenAPI 3.0. Server stubs and client code are auto-generated using `openapi-generator`.

### Generator Setup

**Backend (NestJS Server)**
```bash
# Generate NestJS server stubs
npx @openapitools/openapi-generator-cli generate \
  -i ../openapi/spec.yaml \
  -g typescript-nestjs-server \
  -o src/generated \
  --additional-properties=nestVersion=10.0.0,fileNaming=kebab-case
```

**Frontend (TypeScript Axios Client)**
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i ../openapi/spec.yaml \
  -g typescript-axios \
  -o src/generated/api
```

### NPM Scripts
```json
{
  "generate:server": "openapi-generator-cli generate -i ../openapi/spec.yaml -g typescript-nestjs-server -o src/generated",
  "generate:client": "openapi-generator-cli generate -i ../openapi/spec.yaml -g typescript-axios -o src/generated/api",
  "generate:all": "npm run generate:server --prefix backend && npm run generate:client --prefix frontend"
}
```

### Workflow
1. Define/update endpoints in `openapi/spec.yaml`
2. Run `npm run generate:all` to regenerate code
3. Implement business logic in service classes
4. Controllers delegate to services (generated controllers provide structure)

---

## API Endpoints

### Anime Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/anime` | Get all anime (supports query filters) |
| GET | `/api/anime/:id` | Get single anime by ID |
| PUT | `/api/anime/:id` | Update anime details |
| DELETE | `/api/anime/:id` | Delete anime entry |

### Import/Export Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import` | Upload and import MAL XML file |
| GET | `/api/export` | Export current list |

### Tag Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | Get all tags |
| POST | `/api/tags` | Create new tag |
| PUT | `/api/tags/:id` | Update tag |
| DELETE | `/api/tags/:id` | Delete tag |
| POST | `/api/anime/:id/tags` | Add tags to anime |
| DELETE | `/api/anime/:id/tags/:tagId` | Remove tag from anime |

### Query Parameters for GET /api/anime
| Parameter | Type | Description |
|-----------|------|-------------|
| status | String | Filter by status |
| minScore | Int | Minimum score filter |
| maxScore | Int | Maximum score filter |
| tags | String | Comma-separated tag IDs |
| search | String | Search by title |
| sortBy | String | Field to sort by |
| sortOrder | String | asc or desc |

---

## Implementation Phases

### Phase 1: Project Setup
- [ ] Create OpenAPI specification (spec.yaml)
- [ ] Initialize NestJS backend project
- [ ] Initialize Vite + React frontend project
- [ ] Set up Tailwind CSS in frontend
- [ ] Configure openapi-generator for both server and client
- [ ] Set up Prisma with SQLite
- [ ] Create Docker Compose configuration
- [ ] Create Dockerfiles for both services

### Phase 2: Database & API Core
- [ ] Define Prisma schema
- [ ] Run initial migration
- [ ] Generate NestJS server stubs from OpenAPI
- [ ] Implement service classes with business logic
- [ ] Implement XML parser service for MAL exports
- [ ] Generate TypeScript client for frontend

### Phase 3: Frontend Core
- [ ] Set up Radix UI Table component
- [ ] Create AnimeTable with sortable headers
- [ ] Create AnimeRow with view/edit mode toggle
- [ ] Implement TagsCell with TagBadge display
- [ ] Implement TagEditor with add/remove functionality
- [ ] Implement row-level pending state management
- [ ] Create batch update API integration
- [ ] Create FilterBar component
- [ ] Create ImportButton component
- [ ] Connect to generated API client

### Phase 4: Tagging System
- [ ] Create TagManager component
- [ ] Implement tag assignment UI
- [ ] Add tag filtering to list view

### Phase 5: Polish & Testing
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Responsive design
- [ ] Docker testing
- [ ] Documentation

---

## Development Commands

```bash
# Install dependencies
npm install                       # Root (if using workspaces)
cd backend && npm install
cd frontend && npm install

# Generate code from OpenAPI spec
npm run generate:all              # Both server and client
npm run generate:server           # Backend only
npm run generate:client           # Frontend only

# Run development servers
cd backend && npm run start:dev   # NestJS on port 3001
cd frontend && npm run dev        # Vite on port 3000

# Database
cd backend && npx prisma migrate dev --name description
cd backend && npx prisma generate
cd backend && npx prisma studio   # GUI for database

# Build
cd backend && npm run build
cd frontend && npm run build

# Docker
docker-compose up --build         # Start all services
docker-compose down               # Stop all services
```

---

## Environment Variables

```env
# Backend (.env)
DATABASE_URL=file:./data/anime.db
PORT=3001
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

---

## Notes

- MAL XML export can be obtained from: MyAnimeList > Profile > Export
- SQLite database is stored in `./data/anime.db` for persistence
- The malId field enables future integration with external APIs
