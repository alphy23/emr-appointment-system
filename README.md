# Enterprise EMR — Appointment Management System

A production-oriented Appointment Management module for an Enterprise Electronic
Medical Record (EMR) system, built on the MERN stack (MongoDB, Express, React, Node.js).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Architecture Overview](#architecture-overview)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [Environment Variables](#environment-variables)
8. [Installation Instructions](#installation-instructions)
9. [Running the Project](#running-the-project)
10. [Real-Time Updates (Engineering Challenge)](#real-time-updates-engineering-challenge)
11. [Assumptions Made](#assumptions-made)
12. [Known Limitations](#known-limitations)
13. [Future Improvements](#future-improvements)

---

## Live Demo

- **Frontend:** https://emr-appointment-system-rose.vercel.app
- **Backend API:** https://emr-backend-l0pa.onrender.com/api/v1

> Note: the backend is hosted on Render's free tier, which spins down after
> 15 minutes of inactivity. The first request after idling may take 30–60
> seconds to respond while the service wakes up — subsequent requests are fast.

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@emr.com | Admin@123 |
| Receptionist | priya@emr.com | Reception@123 |
| Doctor | anu@emr.com | Doctor@123 |

Doctor "Dr. Anu Nair" (Cardiology) already has a working schedule configured
(Mon–Fri, 09:00–12:00 & 13:00–17:00, 15-minute slots), so slots are
immediately bookable without any manual setup. Sample patients ("Ravi Kumar",
"Meena Pillai") are also pre-seeded for testing the existing-patient search
during booking.

---

## Project Overview

This system supports three roles — **Super Admin**, **Receptionist**, and **Doctor** —
managing the full lifecycle of a hospital appointment: doctor schedule configuration,
dynamic slot generation, patient search/registration, concurrency-safe booking,
appointment status workflow, search/filter/pagination, audit logging, and live
real-time updates across connected clients.

Full functional requirements implemented:

| # | Feature | Status |
|---|---|---|
| 1 | Authentication (JWT access + refresh, bcrypt, logout invalidation) | ✅ |
| 2 | Role-Based Access Control (Super Admin / Receptionist / Doctor) | ✅ |
| 3 | Doctor Schedule Management (sessions, breaks, slot duration) | ✅ |
| 4 | Appointment Scheduler (filter by doctor/department/date) | ✅ |
| 5 | Dynamic Slot Generation (break-aware, non-overlapping) | ✅ |
| 6 | Appointment Booking (existing + new patient) | ✅ |
| 7 | Concurrency Handling (atomic double-booking prevention) | ✅ |
| 8 | Appointment Management (status workflow, notes, cancellation) | ✅ |
| 9 | Search, Filtering & Pagination (server-side) | ✅ |
| 10 | Logging & Audit Trail | ✅ |
| — | Real-Time Updates via Socket.IO (Engineering Challenge) | ✅ |

---

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Zod
**Frontend:** React (Vite), React Router, TanStack React Query, React Hook Form + Zod,
Tailwind CSS v4, Axios, socket.io-client

**State management choice:** React Query for server state (appointments, slots, doctors —
data owned by the backend, needs caching/refetch/invalidation) + React Context for
auth/session state (small, purely client-side, doesn't need a full store). This was
chosen over Redux Toolkit because the app's client-only state surface is small; most
complexity is server-state synchronization, which React Query handles directly without
extra boilerplate (manual reducers, action creators) that Redux would require for the
same caching/invalidation behavior we get here for free.

---

## Folder Structure

```
emr-appointment-system/
├── backend/
│   └── src/
│       ├── config/          # DB connection, Socket.IO init
│       ├── controllers/     # Thin HTTP layer — parses req, calls services, shapes response
│       ├── services/        # All business logic (booking, slot generation, RBAC scoping)
│       ├── models/          # Mongoose schemas + indexes
│       ├── middlewares/     # authenticate, authorize, validate, errorHandler
│       ├── validators/      # Zod schemas per resource
│       ├── routes/v1/       # Route definitions, mounted under /api/v1
│       ├── utils/           # ApiResponse, ApiError, asyncHandler, generateSlots, time/date helpers
│       ├── sockets/         # Event-emission helpers used by services
│       ├── scripts/         # One-off scripts (seedSuperAdmin.js)
│       ├── app.js           # Express app + middleware wiring
│       └── server.js        # HTTP server bootstrap + Socket.IO attach
│
└── frontend/
    └── src/
        ├── api/              # Axios request functions per resource
        ├── components/
        │   ├── common/       # Button, Input, Select, Modal, Badge, Pagination, Spinner
        │   ├── scheduler/    # DoctorSelect, SlotGrid
        │   ├── booking/      # PatientSearch, BookingModal
        │   └── appointments/ # AppointmentFilters, AppointmentTable, CancelModal
        ├── context/          # AuthContext (session state)
        ├── hooks/            # useSocket, useDebouncedValue
        ├── pages/            # LoginPage, DashboardPage, SchedulerPage,
        │                     # DoctorScheduleFormPage, AppointmentsPage
        ├── routes/           # ProtectedRoute
        ├── App.jsx
        └── main.jsx
```

---

## Architecture Overview

**Layered backend architecture** — Controller → Service → Model, strictly separated:

- **Controllers** are intentionally thin: parse the request, call exactly one service
  function, wrap the result in `ApiResponse`. No business logic lives here.
- **Services** hold all business rules: slot generation math, transition validation,
  concurrency-safe booking, RBAC query-scoping. This is where the engineering
  complexity of the assessment actually lives, and it's fully decoupled from Express
  (services don't touch `req`/`res` at all — they could be called from a CLI script or
  a queue worker with zero changes).
- **Models** are pure Mongoose schemas plus the indexes that enforce data-level
  invariants (e.g., the unique partial index that prevents double booking is enforced
  by MongoDB itself, not application code).

This separation was chosen because it keeps controllers trivially testable/readable,
keeps business logic reusable and unit-testable independent of HTTP, and avoids the
common anti-pattern of "fat controllers" that mix HTTP concerns with domain logic.

**Consistent API contract:** every response follows
`{ success, message, data, meta }`, and every error flows through a single centralized
`errorHandler` middleware — no controller manually shapes an error response.

**Frontend architecture:** page components own data-fetching (via React Query hooks)
and compose smaller, single-responsibility presentational components. Real-time events
(Socket.IO) invalidate React Query cache keys rather than manually patching local
state — this means the UI reacts identically whether a change came from the current
user's own action or another connected user's action, with one code path instead of two.

---

## Database Design

### Collections

- **User** — login credentials, role (`superadmin` / `receptionist` / `doctor`)
- **Doctor** — profile info, linked 1:1 to a `User` (for doctor-role accounts)
- **Schedule** — one per doctor: working days, sessions, breaks, slot duration
- **Patient** — patient records (name, mobile, age, gender, address)
- **Appointment** — links Doctor + Patient + Department + Date + Slot + Status
- **RefreshToken** — server-side tracked refresh tokens (enables logout invalidation)
- **AuditLog** — action trail (user, role, action, entity, entityId, timestamp)

### Relationships

```
User (1) ──── (1) Doctor
Doctor (1) ──── (1) Schedule
Doctor (1) ──── (M) Appointment
Patient (1) ──── (M) Appointment
User (1) ──── (M) RefreshToken
User (1) ──── (M) AuditLog
```

### Sample documents

**Doctor**
```json
{
  "_id": "66a1...",
  "user": "66a0...",
  "name": "Dr. Anu Nair",
  "department": "Cardiology",
  "specialization": "Interventional Cardiology",
  "isActive": true
}
```

**Schedule**
```json
{
  "_id": "66a2...",
  "doctor": "66a1...",
  "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "sessions": [
    { "name": "Morning", "startTime": "09:00", "endTime": "12:00" },
    { "name": "Evening", "startTime": "13:00", "endTime": "17:00" }
  ],
  "breaks": [{ "startTime": "12:00", "endTime": "13:00" }],
  "slotDuration": 15
}
```

**Appointment**
```json
{
  "_id": "66a3...",
  "doctor": "66a1...",
  "patient": "66a4...",
  "department": "Cardiology",
  "date": "2026-07-20",
  "slotStartTime": "09:15",
  "slotEndTime": "09:30",
  "status": "Scheduled",
  "purpose": "Follow-up consultation",
  "createdBy": "66a0..."
}
```

### Indexes and rationale

| Collection | Index | Purpose |
|---|---|---|
| Appointment | `{ doctor: 1, date: 1, slotStartTime: 1 }` unique, partial (`status: { $in: [Scheduled, Arrived, Completed] }`) | **The concurrency guarantee.** Prevents two active appointments occupying the same doctor+date+slot; enforced by MongoDB at the storage layer, not app logic. Partial filter lets a cancelled slot be rebooked. |
| Appointment | `{ patient: 1 }` | Fast lookup of a patient's appointment history |
| Appointment | `{ date: 1, status: 1 }` | Supports the list/filter endpoint's common query shape |
| Doctor | `{ department: 1 }` | Supports "filter by department" in the scheduler |
| Patient | `{ mobile: 1 }`, `{ name: 1 }` | Supports existing-patient search during booking |
| AuditLog | `{ entity: 1, entityId: 1 }`, `{ createdAt: -1 }` | Supports audit trail lookups by entity and recency |
| RefreshToken | `{ expiresAt: 1 }` TTL index | Auto-purges expired tokens, keeps collection lean |

### Query optimization strategy

- `GET /appointments` list uses `.lean()` for read-only responses (skips Mongoose
  document hydration overhead — meaningful at scale since the list endpoint is the
  highest-traffic read path).
- Count and fetch run in `Promise.all()` in parallel rather than sequentially.
- Patient-name/mobile search resolves matching `Patient._id`s first, then filters
  `Appointment` by `patient: { $in: [...] }` — avoids a `$lookup` aggregation at this
  data volume. **Documented tradeoff:** at very large patient/appointment volumes, this
  two-step approach would need to move to an aggregation pipeline or a denormalized
  patient name/mobile snapshot on the Appointment document to avoid the extra round trip.

---

## API Documentation

Base URL: `http://localhost:5000/api/v1`

All authenticated routes require `Authorization: Bearer <accessToken>`.
All responses follow: `{ success, message, data, meta }`.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns access token + sets httpOnly refresh cookie |
| POST | `/auth/refresh` | Public (cookie) | Rotates refresh token, returns new access token |
| POST | `/auth/logout` | Authenticated | Revokes refresh token, clears cookie |
| GET | `/auth/me` | Authenticated | Returns current user's profile |

### Doctors & Schedules

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/doctors` | Super Admin | Creates a doctor (User + Doctor profile, transactional) |
| GET | `/doctors` | Authenticated | Lists doctors, optional `?department=` filter |
| PUT | `/doctors/:doctorId/schedule` | Super Admin | Upserts a doctor's schedule |
| GET | `/doctors/:doctorId/schedule` | Authenticated | Fetches a doctor's schedule |

### Receptionists

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/receptionists` | Super Admin | Creates a receptionist account |

### Patients

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/patients` | Super Admin, Receptionist | Creates a patient record |
| GET | `/patients/search?query=` | Super Admin, Receptionist | Search by ID, mobile, or name |
| GET | `/patients/:id` | All roles | Fetch a single patient |

### Slots

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/slots?doctorId=&date=` | Authenticated | Returns generated slots with `available`/`booked`/`past` status |

### Appointments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/appointments` | Super Admin, Receptionist | Books an appointment (existing or new patient) |
| GET | `/appointments` | All roles | Paginated, filtered, RBAC-scoped list |
| GET | `/appointments/:id` | All roles | Fetch a single appointment |
| PUT | `/appointments/:id` | All roles (field-scoped) | Update purpose (staff) / notes (doctor, own only) |
| POST | `/appointments/:id/arrive` | Super Admin, Receptionist | Marks patient arrived |
| POST | `/appointments/:id/complete` | Super Admin, Doctor (own only) | Marks consultation complete |
| DELETE | `/appointments/:id` | Super Admin, Receptionist | Cancels with a required reason |

**List query parameters:** `doctorId`, `department`, `status`, `dateFrom`, `dateTo`,
`search` (patient name/mobile), `page`, `limit`, `sortBy` (`date`/`createdAt`/`status`),
`sortOrder` (`asc`/`desc`).

### Audit Logs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/audit-logs` | Super Admin | Paginated, filterable audit trail |

### Example response shape

```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": { "...": "..." },
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

## Environment Variables

**Backend (`backend/.env`)**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/emr_appointments
JWT_ACCESS_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (`frontend/.env`)**
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## Installation Instructions

```bash
git clone <repository-url>
cd emr-appointment-system

# Backend
cd backend
npm install
cp .env.example .env    # then fill in real values
npm run seed            # creates Super Admin, Receptionist, Doctor + Schedule, sample Patients

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

## Running the Project

Two terminals, run simultaneously:

```bash
# Terminal 1
cd backend
npm run dev      # http://localhost:5000

# Terminal 2
cd frontend
npm run dev      # http://localhost:5173
```

Log in at `http://localhost:5173/login` with the seeded Super Admin account, then
create Doctors, Receptionists, schedules, and patients from there.

---

## Real-Time Updates (Engineering Challenge)

Implemented with **Socket.IO**, attached to the same HTTP server as Express.

- Sockets authenticate during the handshake using the same JWT access token as HTTP
  requests — no separate auth mechanism to maintain.
- Clients viewing the scheduler join a room scoped to `doctor:<id>:date:<date>` — not a
  global broadcast. Only users actively looking at that exact doctor+date combination
  receive updates, which keeps the event volume proportional to relevant viewers, not
  total connected users.
- The `appointment.service.js` layer emits `appointment:created`, `appointment:updated`,
  or `appointment:cancelled` to the relevant room immediately after each successful
  database mutation.
- The frontend's `useSocket` hook translates incoming events into React Query cache
  invalidations (`queryClient.invalidateQueries`) rather than manually splicing
  state — this means a live update and a local refetch use the exact same rendering
  path, reducing the chance of the UI drifting out of sync with the server.

---

## Assumptions Made

- Only a Super Admin can create Doctor and Receptionist accounts; there is no public
  self-registration, matching the RBAC spec's implied closed-system model for staff.
- Patient records are not deduplicated by mobile number or name (a family can share a
  phone; two patients can share a name) — uniqueness is by Patient ID only.
- A doctor's `department` is stored directly on the Doctor document rather than as a
  separate `Department` collection, since department management wasn't a specified
  requirement — this can be normalized later if departments need their own metadata.
- Appointment `date` is stored as a `"YYYY-MM-DD"` string rather than a `Date` object,
  to avoid timezone-conversion bugs when comparing against day-of-week and "is this
  slot in the past" logic — all comparisons are string/lexicographic, which works
  correctly for ISO-formatted dates.

## Known Limitations

- No automated test suite (unit/integration tests) is included given the assessment's
  time constraints — this is the most significant gap and the first thing to add
  before real production use.
- Doctor department is a free-text field on creation, not selected from a managed list —
  typos would fragment the "filter by department" feature.
- The audit log records the action and actor but does not capture a diff of what
  changed on update — only the raw `updates` object passed in.
- No rate limiting is implemented on auth endpoints (login/refresh) yet.
- The frontend does not yet have a global navigation shell (sidebar/navbar linking all
  pages) — pages are reachable but must currently be navigated to directly by URL.

## Future Improvements

- Add a test suite (Jest/Supertest for backend service-level and endpoint tests;
  Vitest/React Testing Library for frontend components).
- Rate-limit authentication endpoints (e.g. `express-rate-limit`) to reduce brute-force
  exposure.
- Add a proper navigation shell and role-aware dashboard with summary stats.
- Normalize `department` into its own collection once department-level features
  (e.g. department heads, department-specific reporting) are needed.
- Add pagination/virtualization to the audit log and appointment tables for very large
  datasets (see `ENGINEERING_DECISIONS.md` for the scaling discussion).
- Add Docker Compose for one-command local spin-up of backend + MongoDB.
