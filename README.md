# SASP Team Manager

MVP scheduling and squadding web application for the 2026 WilcoSS Texas State Championship and future SASP matches.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma** + **PostgreSQL**
- **NextAuth.js v5** (Auth.js) — credentials-based authentication

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file and configure:
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL and AUTH_SECRET
   ```

   Generate a secure `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

4. (Optional) Seed with sample data:
   ```bash
   npm run db:seed
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Authentication & Roles

All pages require login. Navigate to `/register` to create the first account — it automatically becomes **League Admin**.

| Role | Capabilities |
|------|-------------|
| `LEAGUE_ADMIN` | Full access: manage disciplines, create/edit events, manage all people and teams |
| `MATCH_DIRECTOR` | Create and manage events (any head coach or league admin can be a Match Director) |
| `HEAD_COACH` | Manage their team's roster and commitment status |

### Vercel Deployment

Add these environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Non-pooled connection (required for Neon/Supabase migrations) |
| `AUTH_SECRET` | Random secret (generate with `openssl rand -base64 32`) |

## Features

- **Events**: Create and manage match events (Match Directors and League Admins)
- **Disciplines**: Global disciplines shared across all teams (League Admin only)
- **People & Rosters**: Manage athletes, coaches, and staff per team
- **Import TSV**: Import scheduling data from Google Sheets exports
- **Master Schedule**: View all athlete assignments grouped by flight
- **Athlete Schedule**: Per-athlete schedule view
- **Staff Schedule**: Coach/RO/volunteer schedule view
- **CSV/TSV Export**: Export schedules back to spreadsheet-compatible formats

## Data Import

Sample TSV fixtures are available under `data/tsv/`. You can import them via the `/events/[eventId]/import` page.

### Supported Import Types

| Type | File | Description |
|------|------|-------------|
| `schedule` | Schedule.tsv | Master schedule with flights and stages |
| `squadding` | Squadding.tsv | Squad assignments and relay info |
| `ath_schedule` | Ath Schedule Indy.tsv | Individual athlete schedules |
| `vol_schedule` | Vol Schedule Indy.tsv | Volunteer/coach schedules |
| `ref` | ref.tsv | Reference data (disciplines, gun types) |

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account (first user = League Admin) |
| `/events` | Events list + create |
| `/events/[id]` | Event overview with stats |
| `/events/[id]/import` | TSV import page |
| `/events/[id]/schedule` | Master schedule table |
| `/events/[id]/roster` | Commitment status roster |
| `/events/[id]/staff` | Staff/volunteers list |
| `/events/[id]/flights/[flightId]` | Flight detail with roster |
| `/people` | People list |
| `/disciplines` | Disciplines (League Admin only) |

## Export Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/events/[id]/export?type=schedule&format=csv` | Master schedule CSV |
| `GET /api/events/[id]/export?type=schedule&format=tsv` | Master schedule TSV |
| `GET /api/events/[id]/export?type=athlete&personId=X&format=csv` | Per-athlete CSV |
| `GET /api/events/[id]/export?type=staff&personId=X&format=csv` | Per-staff CSV |
