# SASP Team Manager — Product Roadmap

This document captures the full feature backlog derived from the original PRD, the work completed to date, and the recommended order of implementation with dependency relationships called out.

---

## ✅ Completed (PRs #1–#3, merged to `main`)

| Feature | Details |
|---|---|
| **Core data models** | Event, Flight, Stage, Discipline, Person, Squad, AthleteAssignment, StaffAssignment, CommitmentStatus, Team, User |
| **TSV import pipeline** | Schedule, Squadding, Ath Schedule Indy, Vol Schedule Indy, ref — paste-in import page |
| **Master schedule view** | `/events/[id]/schedule` — rows grouped by flight |
| **Athlete schedule view** | `/events/[id]/athletes/[personId]` — per-athlete assignments |
| **Staff/volunteer schedule view** | `/events/[id]/staff/[personId]` — per-staff assignments |
| **Flight detail view** | `/events/[id]/flights/[flightId]` — relay/order roster |
| **CSV/TSV export** | Master, per-athlete, per-staff exports |
| **People CRUD** | `/people` — add/edit/delete athletes, coaches, staff |
| **PersonStatus lifecycle** | `ACTIVE / INACTIVE / ALUMNI` enum; inline toggle; dimmed rows for inactive; roster picker defaults to ACTIVE |
| **Disciplines CRUD** | `/disciplines` — global disciplines (League Admin only); `shortName` field |
| **People search & filter** | Search by name/team; filter by discipline; bulk commitment-status update |
| **NextAuth v5 authentication** | Credentials provider + JWT; `/login`, `/register` (first user → `LEAGUE_ADMIN`) |
| **Role-based access** | `LEAGUE_ADMIN`, `MATCH_DIRECTOR`, `HEAD_COACH` via `UserRole` enum |
| **Team model** | `Team` + `Person ↔ Team` relation; `User ↔ Team` relation |
| **Commitment status data model** | `CommitmentStatus` (COMMITTED / TENTATIVE / DECLINED / NO_RESPONSE) per person × discipline × event |

---

## 📋 Backlog — Feature Work Streams

Features are grouped into streams. Within a stream, items marked with **→** are sequential (each depends on the one above). Items across different streams can be built **in parallel**.

---

### 🔴 Stream 0 — Foundation
*Do these first. Stream 0 items unblock features in all other streams.*

| ID | Feature | Depends on | Priority |
|---|---|---|---|
| **F1** | **Team Management Pages** — `/teams` list, create, edit, delete; assign coaches (users) to teams | Team model ✅ | 🔥 High |
| **F2** | **Admin Panel: User & Role Management** — UI to promote/demote user roles, link users to teams | Auth ✅ + **F1** | High |
| **F3** | **Person Gender field in UI** — expose `Person.gender` in Add/Edit person forms; filter/group in views | Schema migration needed | Medium |

> **Order:** F1 → F2 (sequential). F3 is independent.

---

### 🟡 Stream A — Event & Schedule Management
*Can run in parallel with Streams B and C.*

| ID | Feature | Depends on | Priority |
|---|---|---|---|
| **A1** | **Event Edit & Delete** — edit event name/dates/description; delete with confirmation + cascade | Events base ✅ | 🔥 High |
| **A2** | **Manual Flight & Stage Builder** — create/edit flights and stages without TSV import | Events base ✅ | High |
| **A3** | **Squad Management UI** — view, create, edit squads per event; assign division/class | **A2** | Medium |
| **A4** | **Manual Athlete Assignment Editor** — form-based or drag-drop assignment of athletes to squads/relays | **A3** | Medium |

> **Order:** A1 is independent. A2 → A3 → A4 (sequential).

---

### 🟡 Stream B — Forecast Planner & Commitment
*Can run in parallel with Streams A and C.*

| ID | Feature | Depends on | Priority |
|---|---|---|---|
| **B1** | **Forecast Planner Grid (Phase 1.5)** — athlete × discipline commitment matrix; status dropdowns; counts/totals by discipline and division; event forecast status workflow (Draft → Prelim → Arbitration → Approved → Production) | CommitmentStatus model ✅ | 🔥 High |
| **B2** | **Bulk Commitment CSV Import/Export** — round-trip CSV for commitment matrix data | **B1** | Medium |
| **B3** | **Commitment Reminder / Notification** — flag or email NO_RESPONSE athletes as deadline approaches | Auth ✅ + **B1** | Low |

> **Order:** B1 → B2, B3 (B2 and B3 can run in parallel after B1).

---

### 🟢 Stream C — Views & Export Enhancements
*Can run in parallel with Streams A and B. All items here are low-risk polish.*

| ID | Feature | Depends on | Priority |
|---|---|---|---|
| **C1** | **Per-Squad Schedule View** — view assignments grouped by squad number | Import data ✅ | Medium |
| **C2** | **Enhanced Schedule Filters** — filter master schedule by discipline, division, squad, flight | Schedule view ✅ | Medium |
| **C3** | **Print-Friendly / PDF Export** — printer-optimised layout for master, athlete, and staff schedules | **C2** | Low |
| **C4** | **Dashboard / Event Stats** — overview cards: participant counts, commitment rates, discipline breakdown, squad fill rates | All data models ✅ | High |

> **Order:** C1, C2, C4 are independent. C2 → C3.

---

### ⚪ Stream D — Phase 2 / Polish
*Build after all streams above are complete or near-complete.*

| ID | Feature | Depends on | Priority |
|---|---|---|---|
| **D1** | **Multi-event Roster Copy** — copy people & commitments from a previous event as a starting point | **F1** + **A1** | Medium |
| **D2** | **PWA / Mobile Optimisation** — service worker, offline schedule view, responsive touch UX | All UI done | Low |
| **D3** | **HEAD_COACH Scoped Views** — coaches see only their own team's roster, commitments, and assignments | **F2** | Medium |

---

## 🗺️ Recommended Execution Order

```
Phase 1 — Start here (all independent / unblock the most):
  ├── F1  Team Management Pages          ← unblocks F2, D1, D3
  ├── F3  Person Gender UI               ← standalone
  ├── A1  Event Edit & Delete            ← standalone, high value
  ├── B1  Forecast Planner Grid          ← high value, standalone
  └── C4  Dashboard / Event Stats        ← standalone

Phase 2 — Parallel streams (after Phase 1):
  ├── Stream A:  A2 → A3 → A4
  ├── Stream B:  B2 and B3 in parallel (after B1)
  └── Stream C:  C1 and C2 in parallel → C3

Phase 3 — Admin & polish (after Phase 2):
  ├── F2  Admin Panel: User & Role Mgmt  ← needs F1
  └── Stream D:  D1, D2, D3
```

---

## 📐 Data Model Snapshot

Current Prisma models (as of last migration `20260423040000_add_person_status`):

```
Event          — match/competition event
Flight         — time slot within an event
Stage          — shooting stage (Go Fast, Focus, etc.)
Discipline     — gun type/class (Rimfire Optic Rifle, PCC, etc.) with shortName
Squad          — squad number + optional name, division
Person         — athlete/coach/staff; PersonRole + PersonStatus (ACTIVE/INACTIVE/ALUMNI)
Team           — coaching team; Person ↔ Team + User ↔ Team
User           — authenticated user; UserRole (LEAGUE_ADMIN/MATCH_DIRECTOR/HEAD_COACH)
AthleteAssignment — person × flight × stage × discipline × squad × relay
StaffAssignment   — coach/RO/volunteer × flight × relay
CommitmentStatus  — person × discipline × event; CommitmentStatusEnum (COMMITTED/TENTATIVE/DECLINED/NO_RESPONSE)
```

### Pending schema additions (not yet migrated)

| Field / Model | Description |
|---|---|
| `Person.gender` | String? — needed for F3 |

---

## 🔗 Related

- Original PRD: [PR #1](https://github.com/J2WFFDev/SASP-Team-Mgr/pull/1) (build MVP scheduling/squadding app)
- Phase 1.5 Forecast Planner specification: PR #1 description, screenshot-driven planner section
- Sample TSV fixtures: `data/tsv/`
