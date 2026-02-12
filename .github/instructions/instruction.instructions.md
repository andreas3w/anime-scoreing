---
applyTo: '**'
---
# Anime List Manager - AI Agent Instructions

## Project Overview

You are building an **Anime List Manager** - a self-hosted web application for managing anime lists imported from MyAnimeList XML exports. The application uses **Next.js 15 with App Router**, React 19, Tailwind CSS 4, Radix UI primitives, and Prisma ORM with SQLite.

**Architecture**: Single Next.js application with Server Components for data fetching and Server Actions for mutations. No separate backend or API layer.

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15.x |
| React | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| UI Primitives | Radix UI | Latest |
| ORM | Prisma | 5.x |
| Database | SQLite | - |
| Language | TypeScript | 5.7+ |

---

## Technology Rules

### General
- **Language**: TypeScript for ALL code
- **No JavaScript files**: Always use `.ts` or `.tsx` extensions
- **Strict TypeScript**: Enable strict mode in tsconfig.json
- **Type Everything**: Define explicit types for all function parameters, return values, and variables where not inferrable

### Next.js App Router Rules
- **Framework**: Next.js 15 with App Router (NOT Pages Router)
- **Port**: Runs on port 3000
- **App Directory**: All routes live in `/src/app/`
- **Server Components**: Default - use for data fetching, no `'use client'` directive
- **Client Components**: Add `'use client'` only when needed (interactivity, hooks, browser APIs)
- **Server Actions**: Use for all data mutations - define in `actions.ts` with `'use server'` directive
- **No API Routes**: Prefer Server Actions over API routes for mutations
- **URL State**: Use `searchParams` for filters/sorting - enables server-side filtering

### Server Components vs Client Components

| Use Server Components For | Use Client Components For |
|---------------------------|---------------------------|
| Data fetching (Prisma queries) | Event handlers (onClick, onChange) |
| Static rendering | useState, useEffect hooks |
| Accessing backend resources | Browser APIs |
| Initial page load | Interactive UI elements |
| SEO-critical content | Form inputs with local state |

### Server Actions Pattern
```typescript
// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveTags(animeId: number, tagNames: string[]) {
  // Direct database operations
  await prisma.animeTag.deleteMany({ where: { animeId } });
  // ... create new tags
  
  // Revalidate to refresh Server Components
  revalidatePath('/');
}
```

### Frontend Rules
- **UI Components**: Radix UI Primitives (unstyled, accessible)
- **Styling**: Tailwind CSS 4 (uses CSS-first configuration)
- **State Management**: React hooks for local state, URL params for shared state
- **Components**: Functional components only, no class components
- **File Structure**:
  - Radix wrapper components in `/src/components/ui/`
  - Feature components in `/src/components/`
  - Custom hooks in `/src/hooks/`
  - Type definitions in `/src/types/`
  - Prisma client in `/src/lib/prisma.ts`

### Database Rules
- **ORM**: Prisma (never write raw SQL)
- **Database**: SQLite only (stored at `./data/anime.db`)
- **Schema Location**: `/prisma/schema.prisma`
- **Migrations**: Always create migrations for schema changes
- **Client**: Singleton prisma client in `/src/lib/prisma.ts`
- **Naming**: Use camelCase for fields, PascalCase for models

---

## Project Structure

```
nextjs-poc/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Server Component - main page with data fetching
│   │   ├── actions.ts        # Server Actions for mutations
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # Radix wrapper components
│   │   │   ├── Button.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── MainContent.tsx   # Client wrapper for interactivity
│   │   ├── AnimeTable.tsx    # Data table with sorting
│   │   ├── AnimeRow.tsx      # Individual row with edit mode
│   │   ├── FilterBar.tsx     # Filters (updates URL params)
│   │   ├── TagEditor.tsx     # Tag editing with autocomplete
│   │   ├── TagBadge.tsx      # Tag display component
│   │   ├── TagsCell.tsx      # Tags cell in table
│   │   └── ImportButton.tsx  # MAL XML import modal
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── lib/
│   │   └── prisma.ts         # Prisma client singleton
│   └── types/
│       └── index.ts          # Shared type definitions
├── prisma/
│   └── schema.prisma         # Database schema
├── data/
│   └── anime.db              # SQLite database file
├── package.json
└── tsconfig.json
```

---

## Code Style Guidelines

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `AnimeTable.tsx` |
| Files (utilities) | camelCase | `prisma.ts` |
| Server Actions | camelCase | `saveTags`, `importMalXml` |
| Variables | camelCase | `animeList` |
| Constants | UPPER_SNAKE_CASE | `STATUS_TAGS` |
| Types/Interfaces | PascalCase | `AnimeEntry` |
| Functions | camelCase | `parseXmlFile` |
| React Components | PascalCase | `FilterBar` |

---

## Code Patterns

### Server Component with Data Fetching
```typescript
// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import { MainContent } from '@/components/MainContent';

// No 'use client' - this is a Server Component
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Build filter conditions from URL params
  const where: Record<string, unknown> = {};
  if (params.search) {
    where.title = { contains: String(params.search) };
  }

  // Direct database query - no API needed!
  const animeList = await prisma.anime.findMany({
    where,
    include: { tags: { include: { tag: true } } },
  });

  return <MainContent initialAnime={animeList} />;
}
```

### Server Action Pattern
```typescript
// src/app/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveTags(animeId: number, tagNames: string[]) {
  // Remove existing custom tags
  await prisma.animeTag.deleteMany({
    where: { animeId, tag: { isStatus: false } },
  });

  // Add new tags
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name, isStatus: false },
      update: {},
    });
    await prisma.animeTag.create({
      data: { animeId, tagId: tag.id },
    });
  }

  // Trigger re-render of Server Components
  revalidatePath('/');
}
```

### Client Component with URL State
```typescript
// src/components/FilterBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Navigate to update URL - triggers Server Component re-fetch
    router.push(`/?${params.toString()}`);
  };

  return (
    <Input
      value={searchParams.get('search') || ''}
      onChange={(e) => updateFilters('search', e.target.value)}
    />
  );
}
```

### Calling Server Actions from Client Components
```typescript
// src/components/AnimeRow.tsx
'use client';

import { saveTags } from '@/app/actions';

export function AnimeRow({ anime }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  const handleSave = async () => {
    // Call Server Action directly - no fetch needed!
    await saveTags(anime.id, currentTags);
    setIsEditing(false);
  };

  return (
    <tr>
      {/* ... */}
      <button onClick={handleSave}>Save</button>
    </tr>
  );
}
```

### Radix UI + Tailwind Pattern
```typescript
// src/components/ui/Select.tsx
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';

interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ options, value, onValueChange, placeholder }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="inline-flex items-center justify-between rounded-md px-3 py-2 text-sm bg-slate-800 text-white border border-slate-700">
        <SelectPrimitive.Value placeholder={placeholder} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="bg-slate-800 rounded-md shadow-lg border border-slate-700">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="px-8 py-2 text-sm text-white rounded-sm hover:bg-slate-700 cursor-pointer"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
```

### Button with CVA Pattern
```typescript
// src/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-slate-700 text-white hover:bg-slate-600',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-slate-800 text-slate-300',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
```

---

## Feature Implementation Guidelines

### XML Import Feature
1. Server Action receives FormData with file
2. Parse XML using `fast-xml-parser`
3. Map MAL XML fields to database schema
4. Use upsert operation (update if malId exists, create if not)
5. Call `revalidatePath('/')` to refresh the page
6. Return import summary (created, updated counts)

### Filtering Feature
1. Filters are URL searchParams (e.g., `?search=naruto&minScore=7`)
2. Server Component reads params and builds Prisma `where` clause
3. Client components update URL via `router.push()`
4. Changing URL triggers automatic server re-fetch
5. No API calls or client-side state management needed

### Tagging Feature
1. Tags are user-created with custom names and colors
2. Many-to-many relationship via AnimeTag junction table
3. Server Action handles tag saves with `revalidatePath()`
4. TagEditor provides autocomplete from existing tags
5. Status tags (isStatus: true) are read-only, set by import

---

## UI/UX Guidelines

### Design Principles
- **Single Page Application**: No routing, entire app in one view
- **Table-first**: Primary interface is a data table
- **Inline editing**: Row-level edit mode for tags, no modals for CRUD
- **URL-driven filters**: All filter state lives in URL searchParams
- **Server-first**: Data fetching happens in Server Components

### Component Architecture

```
page.tsx (Server Component - fetches data)
└── MainContent (Client Component - wrapper)
    ├── Header
    │   └── ImportButton
    ├── FilterBar
    │   ├── SearchInput
    │   ├── SortSelect
    │   ├── ScoreFilters (min/max)
    │   └── TagFilter
    └── AnimeTable
        ├── TableHeader (sortable)
        └── AnimeRow[] 
            ├── Static cells (title, type, score, episodes)
            ├── TagsCell / TagEditor (toggle on edit)
            └── RowActions (Edit/Save/Cancel)
```

### Data Flow Pattern

```
URL Change (filters)
    ↓
Server Component re-renders
    ↓
Prisma query with new filters
    ↓
Fresh data passed to Client Components
    ↓
UI updates
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

**Edit mode interactions:**
- Click Edit → enter edit mode, populate currentTags
- Click × on tag → remove from currentTags
- Type + Enter → add tag name to currentTags
- Click Save → call `saveTags()` Server Action
- Click Cancel → discard changes, exit edit mode

### Color Scheme (Tailwind)
```
Dark Theme (default):
- Background: bg-slate-950 (#020617)
- Surface: bg-slate-900 (#0f172a)
- Border: border-slate-800 (#1e293b)
- Text Primary: text-slate-50 (#f8fafc)
- Text Secondary: text-slate-400 (#94a3b8)

Accent Colors:
- Primary: bg-blue-600 hover:bg-blue-700
- Success: bg-emerald-600
- Warning: bg-amber-500
- Danger: bg-red-600

Status Tag Colors (isStatus: true):
- Watching: bg-blue-500
- Completed: bg-emerald-500
- On-Hold: bg-amber-500
- Dropped: bg-red-500
- Plan to Watch: bg-slate-500
```

### Tag System Architecture

**Two tag types via `isStatus` boolean:**
| Type | `isStatus` | Behavior |
|------|------------|----------|
| Status tags | `true` | Mutually exclusive, set by import |
| Custom tags | `false` | User-created, multiple allowed |

---

## Database Schema

```prisma
model Anime {
  id                 Int        @id @default(autoincrement())
  malId              Int        @unique
  title              String
  type               String?
  episodes           Int?
  myScore            Int        @default(0)
  myStatus           String?
  myWatchedEpisodes  Int        @default(0)
  myStartDate        String?
  myFinishDate       String?
  myLastUpdated      String?
  tags               AnimeTag[]
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}

model Tag {
  id       Int        @id @default(autoincrement())
  name     String     @unique
  color    String     @default("#6366f1")
  isStatus Boolean    @default(false)
  anime    AnimeTag[]
}

model AnimeTag {
  animeId Int
  tagId   Int
  anime   Anime @relation(fields: [animeId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([animeId, tagId])
}
```

---

## Common Tasks

### Adding a New Server Action
1. Open `/src/app/actions.ts`
2. Add function with `'use server'` directive (file already has it at top)
3. Implement database operations using Prisma
4. Call `revalidatePath('/')` to refresh the page
5. Import and call from Client Components

### Adding a New Filter
1. Update `page.tsx` to read new searchParam
2. Add to Prisma `where` clause
3. Add UI control in `FilterBar.tsx`
4. Update URL via `router.push()` when filter changes

### Adding a New Component
1. Create component file in `/src/components/`
2. Add `'use client'` if it needs interactivity
3. Define Props interface at top of file
4. Export as named export
5. Import and use in parent component

### Modifying Database Schema
1. Update `/prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration)
3. Run `npm run db:generate` (regenerates client)
4. Update affected Server Actions and queries
5. Update TypeScript types if needed

### Running the Application
```bash
cd nextjs-poc
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

---

## Do NOT

- ❌ Use `any` type (use `unknown` if truly unknown, then narrow)
- ❌ Write raw SQL queries (use Prisma)
- ❌ Use class components in React
- ❌ Create API routes for mutations (use Server Actions)
- ❌ Install unnecessary dependencies
- ❌ Store sensitive data in code
- ❌ Skip error handling
- ❌ Create files outside the defined project structure
- ❌ Use default exports for components (except `page.tsx`)
- ❌ Ignore TypeScript errors
- ❌ Add `'use client'` to Server Components unnecessarily
- ❌ Fetch data in Client Components (use Server Components)
- ❌ Use `useEffect` for data fetching (use Server Components)

---

## Do

- ✅ Follow existing code patterns
- ✅ Add proper TypeScript types
- ✅ Handle errors gracefully
- ✅ Write self-documenting code
- ✅ Keep components small and focused
- ✅ Use meaningful variable names
- ✅ Use Server Components for data fetching
- ✅ Use Server Actions for mutations
- ✅ Use URL params for filter state
- ✅ Call `revalidatePath()` after mutations
- ✅ Add `'use client'` only when needed
- ✅ Use Radix UI primitives for accessible components
