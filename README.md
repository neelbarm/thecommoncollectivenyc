# The Common Collective — MVP (Phases 1-8)

The Common Collective is a production-minded Next.js MVP with:

- Next.js 15 App Router + TypeScript
- Tailwind CSS + shared design system components
- Prisma ORM + PostgreSQL
- NextAuth credentials auth (email/password)
- Member flows: onboarding, dashboard, events/RSVP, The Drop
- Admin ops dashboard with lightweight operational updates

---

## Implemented scope

### Foundation and member experience
- Public routes: `/`, `/apply`, `/login`, `/signup`
- Member routes: `/onboarding`, `/dashboard`, `/cohort`, `/events`, `/drop`
- Member onboarding flow:
  - multi-step questionnaire
  - draft autosave
  - completion/edit mode
  - persistence to `Profile` + `QuestionnaireResponse` (linked to the member’s **DRAFT** `MemberApplication` when present, so questionnaire data stays attached after a separate `/apply` submission)
  - on submit, promotes that application from **DRAFT** → **SUBMITTED** (admin review) when appropriate; does not downgrade **ACCEPTED** applications
- Member dashboard with cohort/event/drop context
- Events page with RSVP + optimistic updates
- Drop flow with create/cancel request states

### Admin operations
- Admin-only `/admin` route with:
  - overview cards
  - applications/members/questionnaire/cohorts/seasons/events/RSVP/drop/booking/reminder/admin notes views
  - filters by season/cohort/status/search
  - lightweight status update flows and note creation
- Admin APIs:
  - `PATCH /api/admin/applications/[applicationId]`
  - `PATCH /api/admin/cohorts/[cohortId]`
  - `POST /api/admin/seasons`, `GET /api/admin/seasons/data`, `PATCH /api/admin/seasons/[seasonId]` (status and/or name, code, program window)
  - `PATCH /api/admin/events/[eventId]`
  - `PATCH /api/admin/drop-requests/[requestId]`
  - `POST /api/admin/notes`

### Email outbox notifications (manual-first)
- Trigger points:
  - adding a member to a cohort enqueues a `COHORT_WELCOME` outbox email
  - publishing an event (create as `PUBLISHED` or status transition to `PUBLISHED`) enqueues `EVENT_PUBLISHED` emails for relevant members
  - RSVP `GOING` schedules one `EVENT_REMINDER` email 24h before the event (or immediately if inside 24h)
- Delivery model: outbox rows are created during admin writes; actual SMTP sending is done by `POST /api/internal/email/dispatch` (authorized by bearer token).
- Outbox table tracks status (`PENDING` / `SENT` / `FAILED`), attempts (auto-retries up to 3 sends), and dedupe keys to prevent duplicate sends.
- Durable operational visibility: every enqueue/send/skip/failure writes a `NotificationAttempt` record for admin operations at `/admin/notifications`.
- Event reminders:
  - RSVP `GOING` schedules one reminder at 24 hours before event start (or immediate if already inside the 24h window)
  - changing RSVP away from `GOING` unschedules pending reminder
  - reminder dispatch enqueues `EVENT_REMINDER` emails to outbox and marks `Reminder` rows `SENT` / `FAILED`

#### Manual email dispatch run (outbox)

Use this from a secure runner/cron after setting `EMAIL_DISPATCH_TOKEN`:

```bash
curl -X POST "https://your-domain.com/api/internal/email/dispatch" \
  -H "Authorization: Bearer $EMAIL_DISPATCH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":25}'
```

Reminder scheduler run (enqueue due reminder emails from `Reminder` records):

```bash
curl -X POST "https://your-domain.com/api/internal/email/reminders/dispatch" \
  -H "Authorization: Bearer $EMAIL_DISPATCH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":50}'
```

#### Manual reminder dispatch run (cron-safe)

Use this from a secure runner/cron after setting `EMAIL_DISPATCH_TOKEN`:

```bash
curl -X POST "https://your-domain.com/api/internal/email/reminders/dispatch" \
  -H "Authorization: Bearer $EMAIL_DISPATCH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":100}'
```

#### Admin account recovery (CLI, no UI flow)

If an admin is locked out or forgot their password, reset it safely via one-off command:

```bash
npm run admin:reset-password -- --email "admin@commoncollective.nyc" --password "NewStrongPass123!"
```

Notes:
- This updates the password hash directly in DB and reactivates the user.
- User should sign out/in afterward to refresh session/JWT.
- Use only from trusted operator shells.

### Manual concierge operations (primary workflow)
- **Seasons:** `/admin/seasons` — list program windows, **create** seasons (unique code), **edit** name/code/status/dates; shrinking dates blocked if any event would fall outside the new window
- **Cohorts:** `/admin/cohorts` — create cohorts (name, description, season, capacity), edit details, add members by picker, change membership status, remove members
- **Venues:** `/admin/venues` — list venues (with event counts), create venues, edit details; slug from name; no delete (events reference venues)
- **Events:** `/admin/events` — create events (season, optional cohort, venue, times, draft or published), list recent events, **edit** existing events (modal, including **season** reassignment with cohort auto-clear when needed), publish / unpublish (draft ↔ published); **event start/end must fall within the selected season’s program window** (server + client hints)
- **Member cohort page:** `/cohort` — roster and upcoming published cohort events (links to `/events` for RSVP)
- Admin APIs (manual):
  - `POST /api/admin/seasons`, `GET /api/admin/seasons/data`, `PATCH /api/admin/seasons/[seasonId]`
  - `POST /api/admin/cohorts`, `GET /api/admin/cohorts/data`
  - `PATCH /api/admin/cohorts/[cohortId]` (status, capacity, name, description)
  - `POST /api/admin/cohorts/[cohortId]/members`, `PATCH` / `DELETE` on `.../members/[membershipId]`
  - `POST /api/admin/venues`, `GET /api/admin/venues/data`, `PATCH /api/admin/venues/[venueId]`
  - `POST /api/admin/events`, `GET /api/admin/events/data` — cohort (if set) must belong to the event’s season (server-enforced)
  - `PATCH /api/admin/events/[eventId]` (status, title, description, times, capacity, cohort, venue) — same cohort/season rule on cohort changes

### Cohort assignment engine
- Deterministic cohort matching at `/admin/assignments`
- Scorer uses profile fields: neighborhood, interests, vibe, social goal, preferred nights, budget comfort, age range, group energy
- Greedy round-robin + hill-climbing swap optimization
- Admin workflow: generate proposals → review per-cohort rosters → approve (promotes to `CohortMembership`) or reject
- Versioned assignment runs with audit trail (`configJson`, `scoreSnapshot`, creator/approver)
- Admin APIs:
  - `POST /api/admin/assignments/run` — generate proposals
  - `POST /api/admin/assignments/[runId]/approve` — promote to live memberships
  - `POST /api/admin/assignments/[runId]/reject` — reject run
  - `GET /api/admin/assignments/data` — fetch assignment data by season

### Production-readiness passes (Phases 7-8)
- Navigation/state/UX consistency and accessibility improvements across core routes
- Safer API request-body parsing for deployment contexts
- Deployment and launch checklist documentation

---

## Environment variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string for runtime
- `NEXTAUTH_URL`: canonical public app URL (no trailing slash)
- `NEXTAUTH_SECRET`: strong random secret for signing auth tokens

Optional variables:

- `DATABASE_URL_NON_POOLING`: direct DB URL for migration workflows on hosts that use pooled runtime connections
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP transport for outbox email sending
- `EMAIL_FROM`: sender address for outbox emails
- `EMAIL_DISPATCH_TOKEN`: bearer token required by `POST /api/internal/email/dispatch`
- same `EMAIL_DISPATCH_TOKEN` is also required by `POST /api/internal/email/reminders/dispatch`

Generate a secure secret:

```bash
openssl rand -base64 32
```

---

## Local development setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

### 3) Start PostgreSQL (example via Docker)

```bash
docker run --name common-collective-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=common_collective \
  -p 5432:5432 \
  -d postgres:16
```

### 4) Apply schema and generate Prisma client (local)

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 5) Optional seed data

```bash
npm run prisma:seed
```

Seeded credentials:
- Admin: `admin@commoncollective.nyc` / `CommonClub123`
- Member example: `ari@example.com` / `CommonClub123`

### 6) Run app

```bash
npm run dev
```

---

## Exact production deployment steps

The commands below are safe for CI/CD and production hosts.

### 1) Provision PostgreSQL
- Create a production database.
- Obtain connection string(s).

### 2) Set production environment variables on your host

At minimum:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="long-random-secret"
```

Optional:

```bash
DATABASE_URL_NON_POOLING="postgresql://..."
```

Use `DATABASE_URL_NON_POOLING` for migration jobs if your runtime `DATABASE_URL` uses connection pooling/proxying.

### 3) Install and build

```bash
npm ci
npm run lint
npm run build
```

### 4) Run database migrations (deployment-safe)

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5) Optional: seed initial/demo data

Use this only if you intentionally want demo content in that environment:

```bash
npm run prisma:seed
```

### 6) Start app

```bash
npm run start
```

If your host runs its own process manager, use the equivalent start command in that environment.

### Railway (and similar PaaS) — order matters

If deploy logs show **`DriverAdapterError: ColumnNotFound`** (or Prisma errors about a missing column), the database **has not run migrations** for the code you deployed. The app and seed use the Prisma schema from Git; Postgres must be updated **before** those run.

**Correct order every deploy:**

1. **`npx prisma migrate deploy`** — applies pending SQL in `prisma/migrations/` (adds columns like `Cohort.description`, assignment tables, etc.)
2. **`npm run start`** — runs the Next.js server

This repo includes a convenience script that does both in one command:

```bash
npm run start:railway
```

Set your **Railway web service Start Command** to:

`npm run start:railway`

(or explicitly: `npx prisma migrate deploy && npm run start`)

**Do not** set production’s default start command to **`npm run db:seed`** or **`npm run prisma:seed`**. Seed is for **empty demo databases** only: it **deletes and recreates** demo data and will wipe production if you run it on every deploy.

**Optional seed** (once, manually): open a **one-off shell** on the web service and run `npm run db:seed` only when you intentionally want to reset demo content — never as the automatic deploy step.

**SIGTERM / health check failures** often happen when the process **exits** (e.g. seed finishes and the container has nothing left to run). Fix the start command so the **long-running** process is `next start` (with migrate before it as above).

---

## Auth + routing production notes

- `NEXTAUTH_URL` **must** match your public production origin exactly.
- Middleware protects member/admin routes and preserves `callbackUrl` path + query for login redirects.
- `/admin` remains role-gated (`ADMIN`) in middleware and server-side guards.

---

## Prisma command reference (production-safe)

- Generate client:
  - `npx prisma generate`
- Apply existing migrations:
  - `npx prisma migrate deploy`
- Seed:
  - `npm run prisma:seed`

Avoid `prisma migrate dev` in production; it is for local development only.

---

## Launch checklist

### Environment
- [ ] `DATABASE_URL` set correctly
- [ ] `NEXTAUTH_URL` set to canonical public URL
- [ ] `NEXTAUTH_SECRET` set to strong random value
- [ ] (Optional) `DATABASE_URL_NON_POOLING` configured for migration pipeline
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` set for transactional/reminder sends
- [ ] `EMAIL_DISPATCH_TOKEN` set and kept secret (used by both internal dispatch endpoints)

### Database
- [ ] PostgreSQL reachable from deploy environment
- [ ] `npx prisma migrate deploy` completed successfully
- [ ] `npx prisma generate` completed successfully
- [ ] Seed run decision made (`npm run prisma:seed` optional)

### Deploy host steps
- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] migrations applied (`npx prisma migrate deploy` before or via `npm run start:railway`)
- [ ] app started with `npm run start` or **`npm run start:railway`** on Railway (migrate + start)

### Post-deploy smoke tests
- [ ] Run the focused checklist in [`docs/railway-smoke-test.md`](docs/railway-smoke-test.md) (visitor, member, admin)
- [ ] Public pages render: `/`, `/apply`, `/login`, `/signup`
- [ ] Auth works: signup/login/logout
- [ ] Member routes accessible when logged in: `/onboarding`, `/dashboard`, `/events`, `/drop`
- [ ] Protected-route redirect works when logged out
- [ ] Admin route gate works:
  - member blocked from `/admin`
  - admin can access `/admin`
- [ ] Core API flows work:
  - submit application
  - onboarding save + submit
  - RSVP update
  - Drop create/cancel
  - admin status update + note create
- [ ] Internal dispatch routes return auth failure without token and success with token:
  - `POST /api/internal/email/dispatch`
  - `POST /api/internal/email/reminders/dispatch`
- [ ] `/admin/notifications` loads and shows recent attempt/outbox rows
- [ ] retrying a failed outbox row from `/admin/notifications` transitions row to `PENDING`

---

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run start:railway
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

> Note: `npm run prisma:migrate` runs `prisma migrate dev` and is intended for local development only.
> For production, always run `npx prisma migrate deploy`.
