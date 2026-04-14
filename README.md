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
  - persistence to `Profile` + `QuestionnaireResponse`
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
  - `PATCH /api/admin/seasons/[seasonId]`
  - `PATCH /api/admin/events/[eventId]`
  - `PATCH /api/admin/drop-requests/[requestId]`
  - `POST /api/admin/notes`

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

### Database
- [ ] PostgreSQL reachable from deploy environment
- [ ] `npx prisma migrate deploy` completed successfully
- [ ] `npx prisma generate` completed successfully
- [ ] Seed run decision made (`npm run prisma:seed` optional)

### Deploy host steps
- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] migrations applied
- [ ] app started with `npm run start` (or host equivalent)

### Post-deploy smoke tests
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

---

## Useful scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

> Note: `npm run prisma:migrate` runs `prisma migrate dev` and is intended for local development only.
> For production, always run `npx prisma migrate deploy`.
