# Next.js Migration - Anime List Manager

This is the **full migration** from NestJS + Vite to a single Next.js application.

## File Structure

```
nextjs-poc/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Server Component)
│   │   ├── page.tsx            # Home page (Server Component) - fetches data
│   │   ├── actions.ts          # Server Actions (replaces API endpoints)
│   │   └── globals.css
│   ├── components/
│   │   ├── MainContent.tsx     # Main app wrapper (Client) - handles filters/routing
│   │   ├── AnimeTable.tsx      # Table with sorting (Client)
│   │   ├── AnimeRow.tsx        # Single anime row (Client) - edit/save tags
│   │   ├── FilterBar.tsx       # Search/filter controls (Client)
│   │   ├── ImportButton.tsx    # MAL import modal (Client)
│   │   ├── TagsCell.tsx        # Tag display/edit (Client)
│   │   ├── TagEditor.tsx       # Tag autocomplete input (Client)
│   │   ├── TagBadge.tsx        # Single tag badge (Server-compatible)
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Input.tsx
│   │       └── Select.tsx
│   ├── hooks/
│   │   └── useRowEditState.ts  # Tag editing state hook
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── data/
│   └── anime.db                # SQLite database
└── package.json
```

## Key Differences from Previous Architecture

### Before (NestJS + Vite)
```
┌─────────────┐     HTTP/API      ┌─────────────┐
│   React     │ ◄───────────────► │   NestJS    │ ◄──► SQLite
│   (Vite)    │   axios client    │   Backend   │      Prisma
│   Port 3000 │                   │   Port 3002 │
└─────────────┘                   └─────────────┘
     Browser                          Server
```

### After (Next.js)
```
┌────────────────────────────────────────────┐
│              Next.js App                   │
│  ┌──────────────┐    ┌──────────────┐     │
│  │   Server     │    │   Client     │     │ ◄──► SQLite
│  │  Components  │───►│  Components  │     │      Prisma
│  │  (page.tsx)  │    │ ('use client')│     │
│  └──────────────┘    └──────────────┘     │
│         Port 3000 (single app)            │
└────────────────────────────────────────────┘
```

## What is SSR? (Simple Explanation)

**SSR = Server-Side Rendering** means the server generates HTML before sending it to the browser.

### Traditional React (CSR - Client-Side Rendering)
1. Browser loads empty HTML + JavaScript
2. JavaScript runs and makes API calls
3. Data comes back, React renders the page
4. User sees content (slow!)

### Next.js (SSR/Server Components)
1. Server fetches data and renders HTML
2. Browser receives ready-to-display HTML
3. User sees content immediately (fast!)
4. JavaScript "hydrates" for interactivity

## Server Components vs Client Components

### Server Components (default in Next.js 13+)
- Run **only on the server**
- Can directly access databases, file system, etc.
- Cannot use `useState`, `useEffect`, `onClick`, etc.
- No JavaScript sent to browser for these components

```tsx
// src/app/page.tsx - SERVER COMPONENT (no 'use client')
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  // Direct database query - runs on server!
  const anime = await prisma.anime.findMany();
  
  return (
    <main>
      <h1>Anime List ({anime.length} items)</h1>
      <AnimeTable anime={anime} />  {/* Client component */}
    </main>
  );
}
```

### Client Components
- Run in the **browser** (and server for initial render)
- Can use React hooks (`useState`, `useEffect`)
- Can handle user interactions (`onClick`, `onChange`)
- Must have `'use client'` at top of file

```tsx
// src/components/AnimeTable.tsx - CLIENT COMPONENT
'use client';  // <-- This makes it a client component

import { useState } from 'react';

export function AnimeTable({ anime }) {
  const [filter, setFilter] = useState('');  // ✅ Hooks work!
  
  return (
    <input 
      value={filter} 
      onChange={(e) => setFilter(e.target.value)}  // ✅ Events work!
    />
  );
}
```

## Server Actions (Replacing API Endpoints)

Instead of API routes, Next.js has **Server Actions** - functions that run on the server but can be called from client components.

### Before (NestJS API + Axios)
```tsx
// Frontend: Make API call
const res = await axios.post('/api/anime/1/tags', { tags: ['Action'] });

// Backend: Handle in controller
@Post(':id/tags')
async setTags(@Param('id') id: string, @Body() dto: SetTagsDto) {
  return this.animeService.setTags(+id, dto.tags);
}
```

### After (Server Action)
```tsx
// src/app/actions.ts
'use server';  // <-- This file contains server actions

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveTags(animeId: number, tags: string[]) {
  // Direct database access - no API endpoint!
  await prisma.animeTag.deleteMany({ where: { animeId } });
  // ... add new tags
  
  revalidatePath('/');  // Refresh the page data
}

// src/components/AnimeRow.tsx
'use client';

import { saveTags } from '@/app/actions';

function AnimeRow({ anime }) {
  const handleSave = async () => {
    await saveTags(anime.id, currentTags);  // Call server action directly!
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

## File Structure

```
nextjs-poc/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (SERVER)
│   │   ├── page.tsx            # Home page (SERVER) - fetches data
│   │   ├── actions.ts          # Server actions (replaces API)
│   │   └── globals.css
│   ├── components/
│   │   ├── AnimeTable.tsx      # (CLIENT) - has interactivity
│   │   └── ImportButton.tsx    # (CLIENT) - has interactivity
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema (same as before)
├── data/
│   └── anime.db                # SQLite database
└── package.json
```

## What We Eliminated

| Removed | Why |
|---------|-----|
| NestJS backend | Server actions replace API endpoints |
| OpenAPI spec | No API to document |
| Generated API client | Direct function calls |
| Axios | Not needed |
| CORS configuration | Same-origin now |
| Two Docker containers | Single container |
| Port 3002 | Single port (3000) |

## What We Gained

| Benefit | Explanation |
|---------|-------------|
| Faster initial load | Server sends ready HTML |
| Type-safe data flow | No serialization boundary |
| Simpler deployment | One container, one process |
| Less code | ~50% less boilerplate |
| Better DX | No API client regeneration |

## Running the App

```bash
cd nextjs-poc
npm install
npx prisma generate
npx prisma db push        # Create tables (or use existing db)
npm run dev               # Start dev server on port 3000
```

Then open http://localhost:3000

## What Changed from Vite + NestJS

| Old (2 apps) | New (1 app) |
|--------------|-------------|
| `frontend/` + `backend/` | `nextjs-poc/` |
| Vite dev server | Next.js dev server |
| NestJS controllers | Server Actions |
| OpenAPI + Axios client | Direct Prisma queries |
| `useEffect` + fetch | Server Component data loading |
| 2 Docker containers | 1 Docker container |
| Port 3000 + 3002 | Port 3000 |

## Mental Model Shift

### Old thinking (SPA + API):
"Frontend makes requests to backend, backend returns JSON, frontend renders"

### New thinking (Next.js):
"Server component fetches data and renders HTML. Client components add interactivity. Server actions handle mutations."

### The key insight:
- **Reading data** → Server Component (runs on server, direct DB access)
- **User interactions** → Client Component (`'use client'`)
- **Writing/mutating data** → Server Action (`'use server'`)

## When NOT to Use Server Components

Use client components (`'use client'`) when you need:
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`localStorage`, `window`, etc.)
- Third-party libraries that use hooks

Everything else can be a server component!

## Component Breakdown

| Component | Type | Why |
|-----------|------|-----|
| `page.tsx` | Server | Fetches data from Prisma |
| `MainContent` | Client | Uses `useRouter`, `useState` for filters |
| `AnimeTable` | Client | Sort handlers, passes to rows |
| `AnimeRow` | Client | `useState` for edit mode, `useTransition` for save |
| `FilterBar` | Client | Form inputs with `useState` |
| `ImportButton` | Client | File input, modal state |
| `TagEditor` | Client | Input with autocomplete, keyboard nav |
| `TagBadge` | Either | Pure display, no state |
| UI components | Either | Just styling, some have `'use client'` for Radix |
