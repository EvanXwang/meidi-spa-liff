# 美的原點 Spa 仕女館 — LINE LIFF 預約系統

A practice/portfolio project demonstrating **LINE LIFF** integration with a full-stack spa booking application. Users open the app inside LINE, authenticate via LIFF, book spa appointments, and check in on the day of their appointment to earn points.

> **Stack:** Next.js 16 App Router · React 19 · Supabase (PostgreSQL) · Vercel · LINE LIFF SDK 2.x · Tailwind CSS 4 · Framer Motion

---

## Features

| Feature | Description |
|---|---|
| LINE Login | Authenticate via LIFF SDK — no separate password |
| 服務瀏覽 (Services) | Browse spa service catalog with descriptions and pricing |
| 預約流程 (Booking) | 3-step booking form: select date → select therapist → confirm |
| 打卡簽到 (Check-in) | Time-locked check-in (±2 hours of appointment); awards points atomically |
| 會員儀表板 (Dashboard) | Wallet balance, upcoming bookings, remaining course packages |
| 個人頁面 (Profile) | View LINE account info, accumulated points, and logout |

---

## Architecture

```
LINE App (LIFF browser)
    │
    ▼
Next.js 16 App Router (Vercel)
  ├── /dashboard    — wallet balance, upcoming bookings, course packages
  ├── /services     — spa service listing
  ├── /booking      — 3-step booking form
  ├── /today        — time-locked check-in with points display
  └── /profile      — user info + logout
    │
    ▼
API Routes (/api/*)
  ├── POST /api/auth/line    — LINE ID token verify → custom JWT
  ├── GET  /api/me           — aggregated user data (wallet + bookings + courses)
  ├── GET  /api/services     — service catalog
  ├── GET  /api/therapists   — therapist list
  ├── POST /api/bookings     — create booking
  ├── GET  /api/today        — today's booking
  └── POST /api/check-in     — atomic check-in via PG function
    │
    ▼
Supabase (PostgreSQL + RLS)
  Tables:    users, wallet, services, therapists,
             bookings, course_balance, point_logs
  Functions: init_new_user()       — auto-provision wallet on first login
             check_in_booking()    — atomic check-in (time guard + points)
```

---

## Auth Flow

```
LINE LIFF
  │  liff.getIDToken()
  ▼
POST /api/auth/line
  │  verify ID token → LINE verify API
  │  upsert user → Supabase (calls init_new_user())
  │  sign HS256 JWT (1-hour TTL)
  ▼
Bearer token stored in sessionStorage
  │  attached as Authorization header on all /api/* calls
  ▼
API routes decode + verify JWT, attach user context
```

Key design choice: **custom JWT auth** instead of Supabase OAuth. This was intentional — the project goal was to practice LIFF token exchange and custom JWT issuance end-to-end, rather than delegating to a provider.

---

## Local Development Setup

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/EvanXwang/meidi-spa-liff
cd meidi-spa-liff
npm install

# Copy the env template and fill in your values
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables) below), then:

```bash
npm run dev
# Open http://localhost:3000
```

With `NEXT_PUBLIC_ENABLE_DEV=true`, the LINE auth step is bypassed — the app loads a mock user so you can develop locally without a LINE account or LIFF ID.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_LIFF_ID` | Your LINE LIFF ID (from LINE Developers Console) |
| `LINE_CHANNEL_ID` | LINE Login channel ID — used server-side to verify ID tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only; used for upserts and RLS bypass) |
| `SUPABASE_JWT_SECRET` | Secret used to sign/verify custom JWTs (HS256) |
| `SUPABASE_PAT` | Supabase Personal Access Token — required only for running migration scripts |
| `ENABLE_DEV_ENDPOINTS` | `true` to enable `/api/dev/reset-me` (reset test user data); never enable in production |
| `NEXT_PUBLIC_ENABLE_DEV` | `true` to skip LINE auth and load a mock user for local development |

---

## Database Setup

Migrations and PL/pgSQL functions are deployed via Node scripts. All scripts require `SUPABASE_PAT` in `.env.local`.

```bash
# 1. Apply schema + RLS policies
node scripts/apply-migrations-api.mjs

# 2. Deploy init_new_user() — auto-provisions wallet for new users
node scripts/deploy-init-new-user.mjs

# 3. Deploy check_in_booking() — atomic time-guarded check-in function
node scripts/deploy-check-in.mjs
```

The `check_in_booking()` PL/pgSQL function performs the entire check-in operation in a single transaction: it validates the ±2-hour time window, marks the booking as checked in, and appends a row to `point_logs` — preventing any partial-write race conditions.

---

## Running Tests

```bash
npm test        # runs all tests once (vitest run)
npm run test:watch  # watch mode
```

The test suite has **13 tests** covering:

- `tests/auth.test.ts` — JWT sign/verify, invalid token rejection
- `tests/init-new-user.test.ts` — PG function: wallet provisioned on first login
- `tests/check-in-booking.test.ts` — PG function: within-window success, outside-window rejection, duplicate check-in rejection

> **Note:** Tests hit a real Supabase instance. `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` must be set in `.env.local`.

---

## Key Design Decisions

**Custom JWT auth (not Supabase OAuth)**
The project deliberately avoids Supabase's built-in auth. The learning objective was to implement the full LIFF ID token → LINE verify API → custom HS256 JWT pipeline from scratch.

**PL/pgSQL atomic check-in**
`check_in_booking()` wraps the time-window check, status update, and point log insertion in a single PG transaction. This prevents partial writes if the server crashes mid-operation.

**Dev mode bypass**
`NEXT_PUBLIC_ENABLE_DEV=true` injects a mock LIFF user and skips token verification. This makes local development possible without LINE credentials or a deployed LIFF endpoint.

**Tailwind CSS 4 + Framer Motion**
Uses the new Tailwind 4 PostCSS plugin (no `tailwind.config.js`) and Framer Motion for page transition animations inside the LIFF browser.

---

## Deployment

The app is deployed on **Vercel**. Pushing to `main` triggers an automatic production deploy.

**Live URL:** https://meidi-spa-liff.vercel.app

To deploy your own instance:

1. Import the repository on [vercel.com](https://vercel.com)
2. Add all environment variables from the table above (without `SUPABASE_PAT` and the `ENABLE_DEV_*` flags)
3. Run the database setup scripts locally pointing at the production Supabase project
4. Set your LIFF endpoint URL to `https://<your-vercel-domain>` in LINE Developers Console

---

## Project Structure

```
meidi-spa-liff/
├── src/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, bookings, check-in, etc.)
│   │   ├── booking/      # 3-step booking flow
│   │   ├── dashboard/    # Member dashboard
│   │   ├── profile/      # User profile + logout
│   │   ├── services/     # Service listing
│   │   ├── today/        # Day-of check-in page
│   │   └── layout.tsx    # Root layout with AuthProvider
│   └── lib/              # Auth helpers, Supabase clients, LIFF wrapper
├── scripts/              # Migration + PG function deployment scripts
├── supabase/             # SQL migration files
└── tests/                # Vitest integration tests
```

---

*Practice project by [EvanXwang](https://github.com/EvanXwang) — LINE LIFF + Next.js 16 + Supabase learning exercise.*
