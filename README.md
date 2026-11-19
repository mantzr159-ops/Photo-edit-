# Lumora Studio

An AI-powered online graphic design platform: a real canvas editor, templates, multi-page designs, an AI design assistant, image generation, asset management, cloud save and real exports.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn-style UI (Radix) · Konva / react-konva · Zustand + Immer · Supabase (Postgres, Auth, Storage, RLS) · modular AI providers (Anthropic Claude, OpenAI, Replicate) · Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — the app runs without any keys
npm run dev                  # http://localhost:3000
```

With no environment variables the app runs in **Local mode**: projects, pages, uploads, templates and favourites are stored in the browser's IndexedDB, and the AI assistant uses a built-in **offline engine** (keyword themes, extractive summarisation and colour theory — clearly labelled in the UI, not a language model). Add keys to turn on cloud mode and real AI.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build / server |
| `npm test` | Unit tests (Vitest) — store, history, geometry, colour, templates, AI engine, security helpers |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |

## Configuration

All secrets are **server-side only**; nothing but the Supabase URL and anon key (protected by RLS) reaches the browser.

| Variable | Enables |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud mode: accounts, cloud sync, sharing |
| `SUPABASE_SERVICE_ROLE_KEY` *(optional, server only)* | Signing image URLs inside publicly shared projects |
| `ANTHROPIC_API_KEY` (`ANTHROPIC_MODEL`, default `claude-opus-5-5`) | AI design & writing via Claude (preferred) |
| `OPENAI_API_KEY` | Alternative text provider; image generation via `gpt-image-1` |
| `REPLICATE_API_TOKEN` | Image generation via FLUX |
| `REMOVE_BG_API_KEY` | High-quality cloud background removal (a basic in-browser remover always works) |
| `UNSPLASH_ACCESS_KEY` | Unsplash photo search (default: Openverse, Creative-Commons, no key) |
| `AI_TEXT_PROVIDER`, `AI_IMAGE_PROVIDER` | Force a provider (`anthropic`/`openai`/`local`, `openai`/`replicate`) |
| `AI_RATE_LIMIT_PER_MINUTE` | Per-user/IP AI rate limit (default 20) |

`/dashboard/settings` shows which integrations are active.

### Supabase setup

1. Create a project, then run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`). It creates tables, RLS policies, the `assets` storage bucket (private, 15 MB limit, image MIME allow-list), and RPCs.
2. Auth → URL configuration: add `<SITE_URL>/auth/callback` to redirect URLs. Enable email confirmations and the Google provider if wanted.
3. Set the env vars and restart. Protected routes (`/dashboard`, `/editor`) now require sign-in.

## Features

- **Dashboard:** search, create (presets + custom size), recent/starred projects, folders, template library with live previews, categories, uploads manager, trash (restore / delete forever), settings, storage meter, light/dark/system theme.
- **Editor:** top bar (name, undo/redo, save status, zoom, preview, share, download), tool panels (Templates, Design, Elements, Text, Uploads, Photos, Background, AI), properties inspector + layers panel, page strip with thumbnails.
- **Canvas engine:** text, images, shapes, lines/arrows, icons, stickers, frames; move/resize/rotate with handles; multi-select (shift-click, marquee); group/ungroup; copy/cut/paste (incl. system clipboard images & text); duplicate; lock; opacity/colour/border/shadow; layer ordering (and drag-reorder in Layers); align/distribute; smart snapping guides; grid; zoom/pan/pinch; context menu; keyboard shortcuts (press `?`); undo/redo with coalesced history; drag-and-drop from panels and the desktop.
- **Text:** 33 Google Fonts with previews, size, weight, italic/underline/strike, alignment, line height, letter spacing, case, colour/gradient fill, highlight background, outline, shadow, inline editing, presets and font combinations. Side handles reflow; corner handles scale type.
- **Images:** masks (circle, rounded, hexagon, arch, blob), crop zoom/focus, filters, borders, flips, frames that accept dropped images, background removal (in-browser or remove.bg).
- **Backgrounds:** solid, linear/radial gradients, images (fill/fit, blur, opacity), pattern overlays, transparency, apply-to-all-pages.
- **Templates:** 30 original templates across all 16 categories, built from editable primitives; apply as new pages / replace (fit or resize); save your design as a template; favourites.
- **AI assistant:** generate 1–4 structured design concepts from a prompt (concept, layout, palette, typography, hierarchy, icons, copy) compiled into **individually editable elements**; rewrite / summarise / headlines / social posts; palette and element suggestions; layout review + deterministic "smart tidy". Text-to-image with 9 styles, 5 aspect ratios, variations, save to uploads, insert.
- **Export:** PNG, JPG, multi-page PDF, SVG (vector text/shapes, embedded images); current page / all pages (zip) / selected elements; 0.25–6× scale; transparent backgrounds.
- **Persistence:** debounced autosave, save-status indicator, optimistic-concurrency conflict detection, offline handling with retry, local recovery copy offered on reopen, duplicate/trash/delete.
- **Sharing:** private / view link / edit link (cloud mode). Public read-only preview at `/share/<token>`; signed-in users opening an edit link become editors.

## Architecture

```
src/
  app/                    routes (dashboard, editor, auth, share) + API routes (ai/*, photos/*, share/*)
  components/
    editor/               editor shell, canvas/ (react-konva), inspector/, panels/, dialogs/, hooks
    dashboard/ auth/ ui/  dashboard views, auth screens, shadcn-style primitives
  lib/
    design/               document model (types), factories, render descriptors, shapes, fonts, icons
    export/               offscreen renderer, PNG/JPG/PDF exporter, SVG serializer
    storage/              DataRepository interface → LocalRepository (IndexedDB) | SupabaseRepository
    ai/                   schemas (Zod), prompts, provider registry, providers/, layout compiler, guard/rate-limit
    templates/ editor/ security/ image/ utils/
  stores/editor-store.ts  Zustand + Immer editor state and history
supabase/migrations/      schema, RLS, RPCs, storage policies
```

Key decisions:
- **One render pipeline.** `lib/design/render.ts` maps elements to Konva node descriptors used both by the interactive canvas and the offscreen export renderer, so exports match the canvas exactly.
- **Structural sharing.** Immer keeps untouched elements' identity; canvas nodes are memoised per element, so editing one element doesn't re-render others. Drags move Konva nodes directly and commit once on drop.
- **Repository abstraction.** The UI only talks to `DataRepository`; local and cloud modes are interchangeable.
- **AI returns structure, not pixels.** Models produce a Zod-validated `DesignSpec`; a deterministic layout compiler places editable elements. Providers implement `TextProvider` / `ImageProvider` and are selected by env vars. The Claude provider uses structured outputs and server-side refusal fallback.
- **Document storage.** Each page row stores its elements as an ordered `jsonb` array, so a save is one atomic RPC (`save_project`) with revision checks.

## Security

Server-side AI calls only; auth required for AI routes in cloud mode; per-user/IP rate limiting; Zod validation on every API body; upload checks by magic bytes, 15 MB limit, raster downscaling; SVGs sanitised (allow-list, scripts/handlers/external refs removed) and only ever rendered as images; Supabase RLS on every table and storage prefix; SSRF-safe photo proxy with a host allow-list; open-redirect-safe auth redirects; security headers.

## Known limitations / roadmap

- **Real-time collaboration is not implemented.** The schema has `project_members` and edit links, but concurrent editors get conflict detection (reload or keep mine), not live merging, cursors or presence.
- The in-memory rate limiter is per server instance; use Redis/Upstash for multi-instance deployments.
- SVG export embeds raster images and references Google Fonts; Konva image filters are not reproduced in SVG.
- In local mode data lives in one browser; clearing site data deletes it.
- Shared-link collaborators can't load the owner's private uploads inside the editor (the public preview can, via signed URLs).
- Real AI quality depends on configured provider keys; without them the offline engine produces generic, clearly-labelled copy.

## Deploy (Vercel)

Import the repo, set env vars, deploy. `vercel.json` raises function timeouts for the AI routes.

Licences: icons by [Lucide](https://lucide.dev) (ISC); fonts from Google Fonts (OFL/Apache); photos from Openverse/Unsplash under their stated licences (attribution saved on each photo element). All templates, artwork and branding are original.
