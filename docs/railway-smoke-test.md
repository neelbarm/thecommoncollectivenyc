# Railway post-deploy smoke test

Run these checks after a successful deploy (build green, `prisma migrate deploy` completed, app listening).

## Visitor (signed out)

- [ ] `/` loads (home)
- [ ] `/apply` loads and submits without a console error (optional: do not submit real PII in production)
- [ ] `/login` loads; header shows only public nav (no member links that bounce to login)

## Member

Use a test member account (or create one via `/signup`).

- [ ] `/dashboard` loads; no “temporarily unavailable” card
- [ ] `/onboarding` loads; saving a step works (network 200 on PATCH)
- [ ] `/cohort` loads (empty state is OK if not assigned)
- [ ] `/events` lists events; opening an event and RSVP returns success
- [ ] `/drop` loads; if onboarding is incomplete, composer stays gated with a clear CTA
- [ ] Login failure shows clear inline error (invalid password / inactive account)
- [ ] Admin recovery path verified in staging (see `npm run admin:reset-password -- --email=<admin-email> --password='<new-strong-password>'`)

## Admin

Use an account with `ADMIN` role.

- [ ] `/admin` loads
- [ ] `/admin/seasons` loads; create/edit optional
- [ ] `/admin/cohorts` loads
- [ ] `/admin/venues` loads; create a test venue and edit it (optional cleanup: rename only)
- [ ] `/admin/events` loads; **Create event** still works (times within season window); **Edit** saves (season change + cohort); **Publish / Unpublish** still works for draft/published rows
- [ ] `/admin/assignments` loads (optional helper)
- [ ] `/admin/notifications` loads; failed outbox row can be set back to `PENDING` via Retry

## Notifications delivery ops

- [ ] `POST /api/internal/email/reminders/dispatch` returns 200 with valid bearer token
- [ ] `POST /api/internal/email/dispatch` returns 200 with valid bearer token
- [ ] Invalid token returns 401 for both endpoints
- [ ] Outbox failure + retry path works end-to-end (FAILED -> Retry -> PENDING -> SENT)

## If something fails

1. Confirm **Start Command** runs migrations before `next start` (e.g. `npm run start:railway`).
2. Check Railway logs for Prisma errors (missing column/table → migration not applied).
3. Confirm `NEXTAUTH_URL` matches the live URL exactly (no trailing slash).
