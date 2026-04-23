# SASP Team Manager

MVP scheduling and squadding web application for the 2026 WilcoSS Texas State Championship and future SASP matches.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma** + **PostgreSQL**

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file and set your database URL:
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
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

## Features

- **Events**: Create and manage match events
- **Import TSV**: Import scheduling data from Google Sheets exports (Schedule, Squadding, Athlete Schedule, Volunteer/Coach Schedule, Reference data)
- **Master Schedule**: View all athlete assignments grouped by flight
- **Athlete Schedule**: Per-athlete schedule view
- **Staff Schedule**: Coach/RO/volunteer schedule view
- **Flight Detail**: Roster for a specific flight with relay/order
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
| `/events` | Events list + create |
| `/events/[id]` | Event overview with stats |
| `/events/[id]/import` | TSV import page |
| `/events/[id]/schedule` | Master schedule table |
| `/events/[id]/athletes` | Athletes list |
| `/events/[id]/athletes/[personId]` | Individual athlete schedule |
| `/events/[id]/staff` | Staff/volunteers list |
| `/events/[id]/staff/[personId]` | Individual staff schedule |
| `/events/[id]/flights` | Flights list |
| `/events/[id]/flights/[flightId]` | Flight detail with roster |

## Export Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/events/[id]/export?type=schedule&format=csv` | Master schedule CSV |
| `GET /api/events/[id]/export?type=schedule&format=tsv` | Master schedule TSV |
| `GET /api/events/[id]/export?type=athlete&personId=X&format=csv` | Per-athlete CSV |
| `GET /api/events/[id]/export?type=staff&personId=X&format=csv` | Per-staff CSV |
