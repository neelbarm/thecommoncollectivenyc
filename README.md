# The Common Collective — Phase 1 Foundation

Phase 1 delivers the MVP foundation for The Common Collective as a production-minded scaffold:

- Next.js 15 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth credentials auth (email/password)
- Mobile-first responsive UI foundation
- Initial route shells and polished public pages

## What is implemented in Phase 1

### 1) Project foundation
- Clean reusable architecture (`app`, `components`, `lib`, `prisma`, `types`)
- Design system tokens in `app/globals.css` using premium warm brand palette
- Shared layout pieces (site header/footer, app shell)

### 2) Prisma schema
Models included:
- `User`
- `MemberApplication`
- `QuestionnaireResponse`
- `Profile`
- `Season`
- `Cohort`
- `CohortMembership`
- `Venue`
- `Event`
- `RSVP`
- `DropRequest`
- `DropResponse`
- `Booking`
- `Reminder`
- `AdminNote`

Also includes NextAuth support models:
- `Account`
- `Session`
- `VerificationToken`

### 3) Seed data
`prisma/seed.ts` creates:
- 1 admin user
- 12 member users
- 3 cohorts
- 2 seasons
- 3 venues
- 8 events
- sample RSVPs
- 4 drop requests + sample responses
- booking and reminder demo data

### 4) Auth foundation
- Sign up API: `POST /api/auth/signup`
- Credentials login via NextAuth
- Logout via user menu
- Protected member routes via `middleware.ts`
- Admin-only guard for `/admin`

### 5) Route shells
Implemented routes:
- `/`
- `/apply`
- `/login`
- `/signup`
- `/onboarding`
- `/dashboard`
- `/cohort`
- `/events`
- `/drop`
- `/admin`

### 6) Initial UI implementation
Fully designed:
- Home page (`/`)
- Login page (`/login`)
- Signup page (`/signup`)
- Apply page (`/apply`)
- Onboarding flow (`/onboarding`) with:
  - multi-step form UX
  - progress bar
  - draft auto-save
  - completion state + edit mode
  - final persistence to `QuestionnaireResponse` + `Profile`
  - redirect to `/dashboard` after successful completion

Phase 3-5 fully implemented:
- Member dashboard (`/dashboard`)
- Events + RSVP flow (`/events`)
- The Drop (`/drop`)

### 7) Phase 6 admin operations dashboard
- Full admin operations console at `/admin` (admin-only access via middleware + server auth guard).
- Overview cards:
  - total members
  - total applications
  - total cohorts
  - upcoming events
  - active Drop requests
- Sectioned operational views:
  - applications triage
  - members roster
  - questionnaire response summary
  - cohort management
  - season management
  - events management
  - RSVP overview
  - Drop requests management
  - booking and reminder status
  - admin notes stream + create note action
- Useful filters:
  - by season
  - by cohort
  - by application / event / Drop status
  - text search
- Lightweight update actions (no schema changes):
  - update application status
  - update cohort status
  - update season status
  - update event status
  - update Drop request status
  - create admin note

Admin APIs added:
- `PATCH /api/admin/applications/[applicationId]`
- `PATCH /api/admin/cohorts/[cohortId]`
- `PATCH /api/admin/seasons/[seasonId]`
- `PATCH /api/admin/events/[eventId]`
- `PATCH /api/admin/drop-requests/[requestId]`
- `POST /api/admin/notes`

## Environment variables

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/common_collective"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

### Generate a secure `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

## Local PostgreSQL setup (example)

If you need a local postgres container quickly:

```bash
docker run --name common-collective-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=common_collective \
  -p 5432:5432 \
  -d postgres:16
```

## Install dependencies

```bash
npm install
```

## Prisma migration + client generation

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Seed the database

```bash
npm run prisma:seed
```

Seeded credentials:
- Admin: `admin@commoncollective.nyc` / `CommonClub123`
- Member example: `ari@example.com` / `CommonClub123`

## Run development server

```bash
npm run dev
```

App runs at:
- `http://localhost:3000`

## Useful scripts

```bash
npm run lint
npm run build
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

## Project structure

```text
app/
  (public)/
    page.tsx
    apply/page.tsx
    login/page.tsx
    signup/page.tsx
  (member)/
    dashboard/page.tsx
    onboarding/page.tsx
    cohort/page.tsx
    events/page.tsx
    drop/page.tsx
    admin/page.tsx
  api/
    auth/[...nextauth]/route.ts
    auth/signup/route.ts
    applications/route.ts
components/
  layout/
  site/
  ui/
lib/
  auth/
  validations/
  prisma.ts
prisma/
  schema.prisma
  seed.ts
types/
  next-auth.d.ts
```
