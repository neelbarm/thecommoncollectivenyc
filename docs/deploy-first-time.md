# First-time production deploy

Use this after merging to `main` (or your release branch). Order matters: **database → env → web deploy → migrations → smoke test → iOS**.

## 1. Environment variables

Copy `.env.example` at the repo root into your host’s secret manager (or `.env` locally). Minimum for a running app:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Canonical public URL (no trailing slash issues—use full `https://…`) |
| `NEXTAUTH_SECRET` | NextAuth signing secret |
| `SMTP_*`, `EMAIL_FROM`, `EMAIL_DISPATCH_TOKEN` | If you use transactional email and `/api/internal/email/dispatch` |

For **push notifications**, also set `APNS_*` variables (see `docs/ios-app-store-runbook.md`).

## 2. Database

1. Create a **PostgreSQL** database (managed Postgres from your host or external provider).
2. Set `DATABASE_URL` to that database.
3. After the **first** successful web deploy that includes this repo’s `prisma/migrations`, run:

```bash
npx prisma migrate deploy
```

**Railway:** use the service **Start Command** `npm run start:railway` (defined in `package.json`) so migrations run before `next start`, **or** run `migrate deploy` once manually from a shell attached to the service.

**Vercel:** run `prisma migrate deploy` from your machine (or CI) against production `DATABASE_URL` whenever migrations ship—Vercel’s serverless build does not replace a dedicated migrate step unless you add it.

## 3. Railway (recommended if you use `start:railway`)

This repo already includes:

```json
"start:railway": "npx prisma migrate deploy && npm run start"
```

1. **New project** → deploy from GitHub → select this repo / branch.
2. Add a **PostgreSQL** plugin and copy its connection string into `DATABASE_URL`.
3. Set `NEXTAUTH_URL` to the Railway-generated HTTPS URL (then update to your custom domain when attached).
4. Set `NEXTAUTH_SECRET` and email/APNs vars as needed.
5. **Build command:** `npm run build` (or default `npm install && npm run build` if your template uses that).
6. **Start command:** `npm run start:railway` (runs migrations then `next start`).
7. After first deploy, hit `GET https://<your-host>/api/health` — expect `{ "ok": true, ... }`.
8. Open the site, sign in, confirm member routes and `/api/inbox/unread` (logged in) behave as expected.

## 4. Vercel + external Postgres

1. Create a Postgres instance (Neon, Supabase, RDS, etc.) and set `DATABASE_URL` in Vercel **Environment Variables** for Production.
2. Set `NEXTAUTH_URL` to your Vercel production domain (and `NEXTAUTH_SECRET`).
3. **Build:** default `npm run build` (install runs `postinstall` → `prisma generate`).
4. **Migrations:** run locally or in CI after each deploy that adds migrations:

```bash
DATABASE_URL="postgresql://…" npx prisma migrate deploy
```

5. Optional: add a **Deploy Hook** or GitHub Action step that runs `migrate deploy` using a production `DATABASE_URL` secret.

## 5. Generic Node host (Docker, VM, etc.)

1. `NODE_ENV=production`
2. `npm ci` → `npm run build` → `npx prisma migrate deploy` → `npm run start`
3. Put a reverse proxy (Caddy, nginx) in front with TLS; set `NEXTAUTH_URL` to the public HTTPS URL.

## 6. Post-deploy smoke test

- [ ] `GET /api/health` → 200, JSON `ok: true`
- [ ] Login, dashboard, announcements, chat (member shell)
- [ ] Admin routes (as admin user) if applicable
- [ ] If APNs configured: send test announcement / chat message and confirm device receives push (see iOS runbook)

## 7. iOS App Store binary

After production is stable, on a Mac: `npm install` → `npm run ios:sync` → `npm run ios:open` → Xcode archive. Full checklist: `docs/ios-app-store-runbook.md`.
