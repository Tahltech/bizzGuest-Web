# BizzGuest

Guest house / serviced apartment booking platform and property management system for Yaoundé, Cameroon. React + Vite frontend, Express backend, MariaDB, fully Dockerized.

The full architecture (ERD, RBAC, booking-concurrency strategy, payment/notification design, phased build plan) lives in the architecture document shared alongside this repo — this README covers day-to-day setup.

## Status

Implemented so far (Phases 1–3 of the build plan):

- Docker Compose stack (frontend, backend, worker, MariaDB)
- Full database schema (migrations) for every table in the architecture doc
- Seed data: roles, permissions, apartment types, amenities, expense categories, default settings
- Auth: register, login, refresh (rotating sessions), logout, forgot/reset password
- RBAC: roles/permissions resolved from the database, enforced by backend middleware — not just hidden UI
- Campay payment provider adapter (mobile money) — wired, **waiting on your API keys**
- Public site shell, guest account shell, staff dashboard shell, all permission-aware

Not yet built: apartment catalog CRUD, availability search, the booking flow itself, payments UI, housekeeping/maintenance, reports, notifications, reviews. These follow in the next phases.

## Requirements

- Docker + Docker Compose
- Node.js 20+ (only needed if you want to run something outside Docker)

## First-time setup

1. **Copy the environment file** and fill in the values marked `REPLACE_WITH_...`:

   ```bash
   cp .env.example .env
   ```

   Generate the random secrets:

   ```bash
   openssl rand -base64 48   # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (use twice, two different values)
   openssl rand -hex 32      # FIELD_ENCRYPTION_KEY
   ```

2. **Add your Campay credentials** (from your Campay dashboard → Apps) to `.env`:

   ```
   CAMPAY_APP_USERNAME=...
   CAMPAY_APP_PASSWORD=...
   CAMPAY_WEBHOOK_KEY=...
   ```

   Until these are set, the app runs fine — Campay-dependent payment calls will just fail loudly with "Campay is not configured" instead of pretending to succeed.

3. **Add SMTP credentials** (any provider) so transactional email can send:

   ```
   SMTP_HOST=... SMTP_USER=... SMTP_PASSWORD=...
   ```

4. **Start everything:**

   ```bash
   docker compose up
   ```

   This builds the images, starts MariaDB, runs migrations, seeds reference data, and starts the API (`:4000`), worker, and frontend (`:5173`).

5. **Create your Super Administrator account** (deliberately not seeded with a default password):

   ```bash
   docker compose exec backend sh -c \
     "SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='a-strong-password' SUPER_ADMIN_NAME='Your Name' npm run create-admin"
   ```

6. Visit `http://localhost:5173`, log in with that account, and you'll land in `/dashboard` with full permissions.

## Everyday commands

```bash
docker compose up              # start the stack
docker compose down             # stop it
docker compose exec backend npm run migrate     # run new migrations manually
docker compose exec backend npm run seed        # re-run seeds
docker compose logs -f backend                  # tail API logs
```

## Still needs your input

| Item | Where | Why |
|---|---|---|
| `CAMPAY_APP_USERNAME` / `CAMPAY_APP_PASSWORD` | `.env` | Enables MTN MoMo / Orange Money collections via Campay |
| `CAMPAY_WEBHOOK_KEY` | `.env` | Verifies that payment webhooks genuinely come from Campay |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | `.env` | Enables booking/receipt/password-reset emails |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `FIELD_ENCRYPTION_KEY` | `.env` | Random secrets you generate once, see step 1 |
| `DB_PASSWORD` / `DB_ROOT_PASSWORD` | `.env` | Pick strong values before any real deployment |
