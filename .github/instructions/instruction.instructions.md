---
applyTo: '**'
---
# Anime List Manager - AI Agent Instructions

## Project Overview

You are building an **Anime List Manager** - a self-hosted web application for managing anime lists imported from MyAnimeList XML exports. The application uses NestJS backend with OpenAPI-generated server stubs, React + Vite frontend with Radix UI + Tailwind CSS, Prisma ORM with SQLite, all containerized with Docker Compose.

---

## Technology Rules

### General
- **Language**: TypeScript for ALL code
- **No JavaScript files**: Always use `.ts` or `.tsx` extensions
- **Strict TypeScript**: Enable strict mode in tsconfig.json
- **Type Everything**: Define explicit types for all function parameters, return values, and variables where not inferrable

### OpenAPI Rules
- **Specification**: OpenAPI 3.0 in `/openapi/spec.yaml`
- **Server Generator**: `typescript-nestjs-server` (BETA) for NestJS backend
- **Client Generator**: `typescript-axios` for React frontend
- **Workflow**: 
  1. Define endpoints in `openapi/spec.yaml` first
  2. Run `npm run generate:server` to generate NestJS stubs
  3. Run `npm run generate:client` to generate frontend client
  4. Implement business logic in service classes
  5. Controllers use generated DTOs and delegate to services
- **Generated Files**:
  - Backend: `/backend/src/generated/` (controllers, models, api interfaces)
  - Frontend: `/frontend/src/generated/api/` (API client)

#### ⚠️ CRITICAL: Generated Files Policy
- **NEVER edit files in `/backend/src/generated/` or `/frontend/src/generated/`**
- Generated files are abstract classes/interfaces meant to be **implemented**, not modified
- Any changes to generated files will be **lost** on next regeneration
- If generated code doesn't work correctly (e.g., missing decorators for file uploads):
  1. Create a **custom controller/service** in `/src/controllers/` or `/src/services/`
  2. Override the route by registering your custom controller in the module
  3. Import and use the generated types/models, but implement logic separately
- To fix issues with generated code, modify the **OpenAPI spec** and regenerate

### NestJS Backend Rules
- **Framework**: NestJS 10+
- **Port**: Runs on port 3001
- **Structure**:
  - Generated code in `/src/generated/`
  - Implementations in `/src/controllers/`, `/src/services/`
  - Prisma service in `/src/prisma/`
- **Controllers**: Extend or wrap generated controllers
- **Services**: All business logic lives in service classes
- **Validation**: Use class-validator with generated DTOs
- **Error Handling**: Use NestJS exception filters

### Frontend Rules
- **Framework**: React 18+ with Vite
- **UI Components**: Radix UI Primitives (unstyled, accessible components)
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useContext) - no external state libraries
- **API Calls**: Use generated axios client from `/src/generated/api/`
- **Port**: Runs on port 3000
- **Components**: Functional components only, no class components
- **File Structure**:
  - Generated API client in `/src/generated/api/`
  - Radix wrapper components in `/src/components/ui/`
  - Feature components in `/src/components/`
  - Custom hooks in `/src/hooks/`
  - Type definitions in `/src/types/`

### Database Rules
- **ORM**: Prisma (never write raw SQL)
- **Database**: SQLite only (stored at `./data/anime.db`)
- **Schema Location**: `/backend/prisma/schema.prisma`
- **Migrations**: Always create migrations for schema changes
- **Client**: Singleton PrismaService in `/backend/src/prisma/`
- **Naming**: Use camelCase for fields, PascalCase for models

### Docker Rules
- **Compose Version**: Use Docker Compose v3.8+
- **Data Persistence**: Mount `./data` volume for SQLite database
- **Multi-stage Builds**: Use multi-stage Dockerfiles for production
- **Environment Variables**: Use `.env` files, never hardcode secrets

---

## Code Style Guidelines

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `AnimeList.tsx` |
| Files (utilities) | camelCase | `xmlParser.ts` |
| Variables | camelCase | `animeList` |
| Constants | UPPER_SNAKE_CASE | `MAX_SCORE` |
| Types/Interfaces | PascalCase | `AnimeEntry` |
| Functions | camelCase | `parseXmlFile` |
| React Components | PascalCase | `FilterBar` |
| Tailwind Classes | Follow Tailwind conventions | `bg-slate-900 text-white` |

### Radix UI + Tailwind Patterns

#### Radix Component Wrapper Pattern
```typescript
import * as SelectPrimitive from '@radix-ui/react-select';

interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ options, value, onValueChange, placeholder }) => {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="inline-flex items-center justify-between rounded-md px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="overflow-hidden bg-slate-800 rounded-md shadow-lg border border-slate-700">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center px-8 py-2 text-sm text-white rounded-sm hover:bg-slate-700 focus:bg-slate-700 focus:outline-none cursor-pointer"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};
```

#### Button Component Pattern
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'hover:bg-slate-800 text-slate-300 hover:text-white',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button: React.FC<ButtonProps> = ({ className, variant, size, ...props }) => {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
};
```

### Code Patterns

#### OpenAPI Spec Pattern
```yaml
# openapi/spec.yaml
openapi: 3.0.3
info:
  title: Anime List Manager API
  version: 1.0.0
servers:
  - url: http://localhost:3001
paths:
  /anime:
    get:
      operationId: getAnimeList
      tags:
        - Anime
      parameters:
        - name: status
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of anime
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Anime'
components:
  schemas:
    Anime:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        myScore:
          type: integer
```

#### NestJS Service Pattern
```typescript
// backend/src/services/anime.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Anime } from '../generated/model/anime';

@Injectable()
export class AnimeService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { status?: string }): Promise<Anime[]> {
    return this.prisma.anime.findMany({
      where: {
        ...(filters?.status && { myStatus: filters.status }),
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  async findOne(id: number): Promise<Anime | null> {
    return this.prisma.anime.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
  }
}
```

#### NestJS Controller Pattern
```typescript
// backend/src/controllers/anime.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { AnimeService } from '../services/anime.service';
import { Anime } from '../generated/model/anime';

@Controller('anime')
export class AnimeController {
  constructor(private animeService: AnimeService) {}

  @Get()
  async findAll(@Query('status') status?: string): Promise<Anime[]> {
    return this.animeService.findAll({ status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Anime> {
    return this.animeService.findOne(+id);
  }
}
```

#### Frontend API Client Usage
```typescript
// Using generated axios client
import { AnimeApi, Configuration } from '../generated/api';

const config = new Configuration({ basePath: 'http://localhost:3001' });
const animeApi = new AnimeApi(config);

// In component
const { data } = await animeApi.getAnimeList({ status: 'Completed' });
```

#### React Component Pattern
```typescript
interface Props {
  anime: Anime[];
  onFilter: (filters: FilterOptions) => void;
}

export const AnimeList: React.FC<Props> = ({ anime, onFilter }) => {
  // Component logic
  return (
    // JSX
  );
};
```

---

## Feature Implementation Guidelines

### XML Import Feature
1. Accept file upload via multipart form data
2. Parse XML using a library like `fast-xml-parser`
3. Map MAL XML fields to database schema
4. Use upsert operation (update if malId exists, create if not)
5. Return import summary (created, updated, failed counts)

### Filtering Feature
1. All filtering happens server-side via query parameters
2. Support multiple filters simultaneously
3. Return paginated results if list is large
4. Filters to support:
   - `status`: exact match
   - `minScore` / `maxScore`: range
   - `tags`: array of tag IDs (AND logic)
   - `search`: partial match on title (case-insensitive)

### Tagging Feature
1. Tags are user-created with custom names and colors
2. Many-to-many relationship via AnimeTag junction table
3. Bulk tag assignment should be supported
4. Deleting a tag removes all associations (cascade)

---

## UI/UX Guidelines

### Design Principles
- **Single Page Application**: No routing, entire app in one view
- **Table-first**: Primary interface is a data grid using Radix Table
- **Inline editing**: Row-level edit mode, no modals for CRUD operations
- **Batch operations**: Accumulate changes locally, persist on explicit save
- **Optimistic state**: Visual feedback for pending changes before commit

### Component Architecture

```
App
├── Header
│   ├── ImportButton
│   └── (future: global actions)
├── FilterBar
│   ├── StatusFilter (Select)
│   ├── ScoreFilter (min/max inputs)
│   ├── TagFilter (multi-select)
│   └── SearchInput
└── AnimeTable
    ├── TableHeader (sortable)
    └── AnimeRow[] 
        ├── Static cells (title, type, episodes)
        ├── TagsCell / TagEditor (toggle on edit)
        └── RowActions (Edit/Save/Cancel)
```

### Row Edit Mode Implementation

**State per row:**
```typescript
interface RowEditState {
  isEditing: boolean;
  currentTags: string[];  // Working copy of custom tag names
}
```

**What's editable in UI:**
- ✅ Custom tags only
- ❌ Status tags (read-only, set by import)
- ❌ Score (read-only, set by import)
- ❌ All other fields (read-only, set by import)

**Behavior:**
| State | TagsCell Renders | Actions Available |
|-------|------------------|-------------------|
| `isEditing: false` | `TagBadge[]` (read-only) | Edit button |
| `isEditing: true` | `TagEditor` with × buttons + input | Save, Cancel buttons |

**Edit mode tag interactions:**
- Click × on custom tag → remove from `currentTags` array
- Type + Enter → add tag name to `currentTags` array
- Click Save → POST `{ tags: currentTags }`, backend handles diff
- Click Cancel → discard changes, exit edit mode
- **Status tags**: Displayed but NOT in edit state (grayed out, no × button)

### API Contract for Tag Update
```typescript
// POST /anime/:id/tags
interface SetTagsRequest {
  tags: string[];  // Complete list of custom tag names
}

// Backend logic:
// 1. Get current custom tags for anime (where isStatus: false)
// 2. Compare with incoming list
// 3. Remove tags not in list
// 4. Add new tags (create Tag if name doesn't exist, isStatus: false)
// 5. Status tags are NEVER modified by this endpoint
```

### XML Import Logic
```typescript
// POST /import (multipart form with XML file)
// For each anime in XML:

async function importAnimeEntry(xmlEntry: MalXmlEntry) {
  const existing = await findByMalId(xmlEntry.malId);
  
  if (existing) {
    // UPDATE: Overwrite all fields except custom tags
    await prisma.anime.update({
      where: { malId: xmlEntry.malId },
      data: {
        title: xmlEntry.title,
        type: xmlEntry.type,
        episodes: xmlEntry.episodes,
        myScore: xmlEntry.myScore,
        myWatchedEpisodes: xmlEntry.myWatchedEpisodes,
        // ... all other fields from XML
      }
    });
    
    // Update status tag (remove old, add new if changed)
    const currentStatusTag = await getCurrentStatusTag(existing.id);
    const newStatusTag = mapMalStatusToTag(xmlEntry.myStatus);
    
    if (currentStatusTag?.id !== newStatusTag.id) {
      await removeTagFromAnime(existing.id, currentStatusTag?.id);
      await addTagToAnime(existing.id, newStatusTag.id);
    }
    
    // Custom tags: DO NOT TOUCH
    
  } else {
    // CREATE: New anime with status tag
    const anime = await prisma.anime.create({ data: { ...xmlEntry } });
    const statusTag = mapMalStatusToTag(xmlEntry.myStatus);
    await addTagToAnime(anime.id, statusTag.id);
  }
}
```

### Future: Details Popup (v2)
- Click on anime title → open popup/drawer
- Fetch from external API (Jikan)
- Display: cover image, synopsis, genres, studios
- **Not in MVP scope**

### Color Scheme (Tailwind)
```
Dark Theme (default):
- Background: bg-slate-950 (#020617)
- Surface: bg-slate-900 (#0f172a)
- Border: border-slate-800 (#1e293b)
- Text Primary: text-slate-50 (#f8fafc)
- Text Secondary: text-slate-400 (#94a3b8)

Accent Colors:
- Primary: bg-blue-600 hover:bg-blue-700 (#2563eb)
- Success: bg-emerald-600 (#059669)
- Warning: bg-amber-500 (#f59e0b)
- Danger: bg-red-600 (#dc2626)

Status Tag Colors (isStatus: true):
- Watching: bg-blue-500
- Completed: bg-emerald-500
- On-Hold: bg-amber-500
- Dropped: bg-red-500
- Plan to Watch: bg-slate-500

Custom Tag Colors:
- User-defined hex colors stored in Tag.color
```

### Tag System Architecture

**Two tag types via `isStatus` boolean:**
| Type | `isStatus` | Behavior |
|------|------------|----------|
| Status tags | `true` | Mutually exclusive, seeded on init |
| Custom tags | `false` | User-created, multiple allowed |

**Status tag enforcement:**
- When adding a status tag, automatically remove other status tags
- Handled in backend service, transparent to frontend

**Seeded status tags (created on first run):**
```typescript
const STATUS_TAGS = [
  { name: 'Watching', color: '#3b82f6', isStatus: true },
  { name: 'Completed', color: '#10b981', isStatus: true },
  { name: 'On-Hold', color: '#f59e0b', isStatus: true },
  { name: 'Dropped', color: '#ef4444', isStatus: true },
  { name: 'Plan to Watch', color: '#64748b', isStatus: true },
];
```

---

## File Reference

Always refer to `PROJECT_PLAN.md` for:
- Database schema details
- API endpoint specifications
- Project structure
- Implementation phases checklist

---

## Common Tasks

### Adding a New API Endpoint
1. Define the endpoint in `openapi/spec.yaml`
2. Run `npm run generate:server` to regenerate NestJS stubs
3. Run `npm run generate:client` to regenerate frontend client
4. Add service method in `/backend/src/services/`
5. Wire up controller to service in `/backend/src/controllers/`
6. Use the generated client in frontend components

### Adding a New Component
1. Create component file in `/frontend/src/components/`
2. Define Props interface at top of file
3. Export as named export
4. Add any needed types to `/frontend/src/types/index.ts`
5. Import and use in parent component

### Modifying Database Schema
1. Update `/backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description_of_change`
3. Run `npx prisma generate`
4. Update OpenAPI spec if API changes
5. Regenerate API types with `npm run generate:all`
6. Update affected services and controllers

---

## Do NOT

- ❌ **Edit files in `/src/generated/` folders** - they are regenerated and changes will be lost
- ❌ Use `any` type (use `unknown` if truly unknown, then narrow)
- ❌ Write raw SQL queries (use Prisma)
- ❌ Use class components in React
- ❌ Install unnecessary dependencies
- ❌ Store sensitive data in code
- ❌ Skip error handling
- ❌ Create files outside the defined project structure
- ❌ Use default exports (prefer named exports)
- ❌ Ignore TypeScript errors

---

## Do

- ✅ Follow existing code patterns
- ✅ Add proper TypeScript types
- ✅ Handle errors gracefully
- ✅ Write self-documenting code
- ✅ Keep components small and focused
- ✅ Use meaningful variable names
- ✅ Test Docker builds before committing
- ✅ Update PROJECT_PLAN.md checkboxes when completing features
