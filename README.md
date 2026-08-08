# BizzGuest

Guest house / serviced apartment booking platform and property management system for Yaoundé, Cameroon. React + Vite frontend, Express backend, MariaDB. Dockerized for later use; currently developed and run natively.

The full architecture (ERD, RBAC, booking-concurrency strategy, payment/notification design, phased build plan) lives in the architecture document shared alongside this repo — this README covers day-to-day setup.

## Status

Implemented so far (Phases 1–8 of the build plan):

- Full database schema (migrations) for every table in the architecture doc, verified against real MariaDB
- Seed data: roles, permissions, apartment types, amenities, expense categories, default settings
- Auth: register, login, refresh (rotating sessions), logout, forgot/reset password
- RBAC: roles/permissions resolved from the database, enforced by backend middleware — not just hidden UI
- Apartment catalog: CRUD, amenities, media upload (local storage adapter), pricing rules, blocked dates
- Availability search implementing the overlap predicate from architecture §9
- **Booking engine**: the row-lock + in-transaction re-check from architecture §10, verified with a real concurrent-request test — two simultaneous bookings for the same apartment/dates, exactly one succeeds
- Full booking flow: search → apartment detail → review with live pricing → confirmation, guest "My Bookings", staff "Reservations"
- **Payments**: Campay mobile money collection, webhook confirmation, a polling fallback that confirms payments even before a public webhook URL is registered, manual cash/bank-transfer recording, and refunds — all verified end-to-end against the real database. **Waiting on your Campay API keys** to actually process real money; every code path fails gracefully with a clear message until then, never fakes success
- Deep navy / warm cream / soft gold visual identity applied across the whole app
- Public site, guest account area, staff dashboard, all permission-aware

Not yet built: check-in/check-out, housekeeping/maintenance, financial reports, notifications UI, email delivery (SMTP), reviews. These follow in the next phases.

## Running it locally — no Docker required

Docker Desktop isn't required for day-to-day development; the app runs natively against a local MariaDB instance. If you have **WAMP** installed (as this project's dev environment does), you already have a MariaDB binary you can reuse in an isolated data directory — see below. Otherwise install MariaDB/MySQL directly.

### 1. Start a local MariaDB instance

Using a WAMP install as the source of the `mariadbd`/`mysql` binaries (adjust the version path to what you have):

```bash
# One-time: initialize an isolated data directory (never touches your other DBs)
"<wamp>\bin\mariadb\mariadb11.3.2\bin\mariadb-install-db.exe" \
  --datadir="<project>\var\mariadb-data" --password="<root-password>" --port=3307 --default-user

# Start it (repeat this each time you want to work on the project)
"<wamp>\bin\mariadb\mariadb11.3.2\bin\mariadbd.exe" \
  --datadir="<project>\var\mariadb-data" --port=3307 --bind-address=127.0.0.1
```

Then create the app database/user once:

```sql
CREATE DATABASE bizzguest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bizzguest_app'@'127.0.0.1' IDENTIFIED BY '<app-password>';
GRANT ALL PRIVILEGES ON bizzguest.* TO 'bizzguest_app'@'127.0.0.1';
```

### 2. Configure environment

Copy `.env.example` to **both** `.env` (repo root) and `backend/.env` (Node's `dotenv` reads from the process's working directory, so the backend needs its own copy when run outside Docker). Point the DB block at your local instance:

```
DB_HOST=127.0.0.1
DB_PORT_INTERNAL=3307
DB_NAME=bizzguest
DB_USER=bizzguest_app
DB_PASSWORD=<app-password>
```

Pick a free port for the API if `4000` is already taken on your machine (check with `netstat -ano | grep :4000` first) — set `BACKEND_PORT_INTERNAL` and `API_URL` accordingly, and add a matching `frontend/.env` with `VITE_API_URL=http://localhost:<port>`.

Generate the required secrets:

```bash
openssl rand -base64 48   # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (run twice, two different values)
openssl rand -hex 32      # FIELD_ENCRYPTION_KEY
```

### 3. Install, migrate, seed

```bash
cd backend && npm install && npm run migrate && npm run seed
cd ../frontend && npm install
```

### 4. Create your Super Administrator account

```bash
cd backend
SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='a-strong-password' SUPER_ADMIN_NAME='Your Name' npm run create-admin
```

### 5. Run it

```bash
cd backend && npm run dev      # API on http://localhost:<BACKEND_PORT_INTERNAL>
cd backend && npm run worker   # background worker: emails, expired holds, Campay payment polling
cd frontend && npm run dev     # site on http://localhost:5173
```

Visit the frontend URL, log in with your admin account, and you'll land in `/dashboard` with full permissions. The worker isn't optional once payments are in the picture — it's what confirms mobile money payments automatically if Campay's dashboard isn't (yet) pointed at a public webhook URL.

## Running it with Docker (once available)

The Docker Compose setup (`docker-compose.yml`, both Dockerfiles) is complete and untouched — this is the intended path once Docker Desktop is available (e.g. after pulling this repo down on another machine):

```bash
cp .env.example .env       # fill in secrets as above; leave DB_HOST=db, ports at their defaults
docker compose up --build
docker compose exec backend sh -c \
  "SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='a-strong-password' SUPER_ADMIN_NAME='Your Name' npm run create-admin"
```

Frontend at `:5173`, API at `:4000`. `docker compose exec backend npm run migrate` / `npm run seed` to run those manually; `docker compose logs -f backend` to tail logs.

## Still needs your input

| Item | Where | Why |
|---|---|---|
| `CAMPAY_APP_USERNAME` / `CAMPAY_APP_PASSWORD` | `.env` | Enables MTN MoMo / Orange Money collections via Campay. Until set, mobile money payment attempts fail with a clear "not set up yet" message instead of erroring |
| `CAMPAY_WEBHOOK_KEY` | `.env` | Verifies that payment webhooks genuinely come from Campay. Not strictly required to test payments locally — the worker's polling fallback confirms them without it, useful since `localhost` can't receive real webhooks anyway |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | `.env` | Enables booking/receipt/password-reset emails |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `FIELD_ENCRYPTION_KEY` | `.env` | Random secrets you generate once |
| `DB_PASSWORD` / `DB_ROOT_PASSWORD` | `.env` | Pick strong values before any real deployment |

## Note on this dev machine

`var/` (gitignored) holds a local-only MariaDB data directory used for native development — isolated from any other MySQL/MariaDB install on this machine, safe to delete and recreate at any time. `.env` and `backend/.env`/`frontend/.env` are also gitignored and contain machine-specific ports/secrets that won't carry over when you clone this repo elsewhere.
