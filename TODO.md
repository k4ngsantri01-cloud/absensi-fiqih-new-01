# TODO Refactor: React + Vite Frontend Direct Supabase (supabase-js)

## Step 1 — Plan completion
- [x] Gather repo context (db.ts, server.ts, components)
- [x] Approve edit plan

## Step 2 — Dependency & scripts
- [x] Update `package.json`:
  - add `@supabase/supabase-js` to dependencies
  - adjust scripts so Netlify/Vite build doesn’t rely on `server.ts`

## Step 3 — Refactor database layer
- [ ] Refactor `src/lib/db.ts` to:
  - remove all calls to `/api/supabase-*` and Express proxy
  - use `@supabase/supabase-js` directly for test/push/pull CRUD
  - keep existing `db.*` API and localStorage behavior intact
  - use `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only (no hardcode)


## Step 4 — Install and validate
- [ ] Run `npm install`
- [ ] Run `npm run build` and fix any TS errors
- [ ] Manual runtime checks:
  - Setting: Tes Koneksi, Push, Pull
  - Santri CRUD
  - Presensi save & delete session

## Step 5 — Cleanup/Compliance
- [ ] Confirm no runtime dependency on Express/proxy routes remains

