# Upcountry Living

Inventory management mobile app for an antique/resale shop — lets you capture items with photos, track inventory, view analytics, and research pricing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo (React Native) with expo-router

## Where things live

- `artifacts/mobile/` — Expo mobile app
- `artifacts/mobile/context/InventoryContext.tsx` — inventory state, AsyncStorage, CRUD, seed data
- `artifacts/mobile/constants/colors.ts` — Upcountry Living brand palette (warm earthy tones)
- `artifacts/mobile/constants/comps.ts` — comp pricing lookup data
- `artifacts/mobile/app/(tabs)/` — four tab screens: index (Capture), inventory, analytics, pricing
- `artifacts/mobile/components/` — ItemDetailSheet, PostConfirmSheet
- `artifacts/api-server/` — Express API server

## Architecture decisions

- Frontend-only first build: all data stored in AsyncStorage via InventoryContext, no backend DB needed for MVP
- Four-tab navigation matching the original HTML app: Capture, Inventory, Analytics, Pricing
- Seed data pre-populated on first launch so the app feels live immediately
- Warm earthy palette (#735D4D accent) mirroring the original HTML design
- Comp pricing uses a local lookup table (no external API) with realistic randomized fallback

## Product

- **Capture**: photograph items, fill form (name/category/condition/price/notes), research comps, save to inventory or post to site
- **Inventory**: browse/search/filter/sort all items, tap for detail sheet with full CRUD (edit notes, mark sold, list, delete, post)
- **Analytics**: stats grid, hot/cold item rankings, 6-month revenue vs cost bar chart, profit by category, avg days to sell
- **Pricing Tool**: search comparable sold prices, see low/mid/high ranges, use price in capture

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- makeId() uses `Date.now().toString() + Math.random()...` — do NOT use the 'uuid' package (crashes on iOS)
- Font family uses Inter (pre-installed) — Poppins/DM Sans from the original HTML were not added to keep bundle lean

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
