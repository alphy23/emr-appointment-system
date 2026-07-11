# Engineering Decisions

This document explains the reasoning behind the key technical decisions made while
building this system, as required by the assessment.

---

## 1. Why did you choose your project architecture?

The backend follows a strict **layered architecture**: `Controller → Service → Model`,
with supporting `middlewares`, `validators`, and `utils` layers.

- **Controllers are intentionally thin.** They parse the request, call one service
  function, and format the response via `ApiResponse`. This keeps HTTP concerns (status
  codes, request/response shape) completely separate from business rules.
- **Services own all business logic** — slot generation, transition validation for
  appointment status, RBAC-based query scoping, and the booking transaction itself.
  Because services never touch `req`/`res`, they're reusable outside an HTTP context
  (a background job, a CLI script, a future GraphQL layer) without modification, and
  they're straightforward to unit test in isolation.
- **Models carry data-level invariants**, most importantly the unique partial index
  on `Appointment` that guarantees no double booking — this is enforced by MongoDB
  itself, not by application code, which is a stronger guarantee than anything a
  service-layer check alone could offer under concurrent access.

This structure was chosen over a simpler "fat controller" or MVC-without-services
approach specifically because the assessment's grading criteria explicitly called out
maintainability and separation of concerns as more important than raw feature count —
a layered structure is what makes the codebase easy to extend feature-by-feature
(which is exactly how this project was built, one endpoint at a time) without files
growing unmanageable or logic getting duplicated across controllers.

On the frontend, page components own data-fetching (via React Query) and compose
smaller presentational components — mirroring the same "logic separated from
presentation" principle used on the backend.

---

## 2. How did you design your MongoDB schema?

Seven collections, modeling the domain as directly as the requirements describe it:
`User`, `Doctor`, `Schedule`, `Patient`, `Appointment`, `RefreshToken`, `AuditLog`.

Key decisions:

- **`User` and `Doctor` are separate documents**, linked 1:1 (`Doctor.user` references
  `User._id`), rather than merging doctor-specific fields onto `User`. This keeps
  authentication concerns (email, password, role) cleanly separated from clinical
  profile concerns (department, specialization), and means a future non-login doctor
  record (e.g. imported from another system before an account exists) wouldn't require
  schema contortions.
- **`Schedule` is a separate collection from `Doctor`**, one-to-one, rather than an
  embedded sub-document on `Doctor`. Schedules are updated independently and can grow
  in complexity (multiple sessions, multiple breaks) — keeping them separate avoids
  bloating every doctor-list query with schedule data that isn't needed there.
- **`Appointment.date` is stored as an ISO `"YYYY-MM-DD"` string**, not a `Date` object.
  This was a deliberate tradeoff: string dates compare correctly lexicographically for
  range queries and equality checks, and completely sidestep timezone-conversion bugs
  that plague `Date`-typed fields when comparing "is this today," "is this slot in the
  past," or matching against a doctor's `workingDays`. The cost is losing native
  date-arithmetic in queries, which wasn't needed anywhere in this feature set.
- **Patient records are not deduplicated** by mobile or name — only `_id` uniquely
  identifies a patient, matching real-world reality (shared family phones, common
  names) rather than forcing false uniqueness constraints that would reject legitimate
  data.

---

## 3. How did you prevent double booking?

With a **MongoDB unique compound index with a partial filter expression** on the
`Appointment` collection:

```js
appointmentSchema.index(
  { doctor: 1, date: 1, slotStartTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["Scheduled", "Arrived", "Completed"] } },
  }
);
```

This is the actual guarantee — enforced by the database's storage engine, not by
application-level checks (which are inherently racy: a "check if booked, then insert"
pattern in application code has a window between the check and the write where two
concurrent requests can both pass the check before either has written). If two
requests race to book the same `doctor + date + slotStartTime` combination, MongoDB
rejects the second insert with a duplicate-key error (`code 11000`), which the service
layer catches and converts into a `409 Conflict` with a clear message.

The **partial filter** (`status: { $in: [...] }`, excluding `Cancelled`) means a
cancelled appointment's slot doesn't permanently block rebooking — cancelling releases
the slot immediately, without needing a separate cleanup step.

A **Mongoose transaction** wraps the patient-lookup/creation and the appointment
insert together, so a new-patient-plus-booking either fully succeeds or fully rolls
back — there's no scenario where a patient record gets created but the appointment
insert fails, leaving orphaned data.

This was verified manually by firing two identical concurrent booking requests at the
same slot and confirming exactly one succeeds while the other receives the 409.

---

## 4. Which database indexes did you create and why?

| Index | Reason |
|---|---|
| `Appointment { doctor, date, slotStartTime }` — unique, partial | The double-booking guarantee (see above) |
| `Appointment { patient: 1 }` | Fast retrieval of a patient's appointment history |
| `Appointment { date: 1, status: 1 }` | Matches the most common shape of the list/filter query |
| `Doctor { department: 1 }` | Supports filtering the scheduler/doctor list by department |
| `Patient { mobile: 1 }`, `Patient { name: 1 }` | Supports the existing-patient search used during booking |
| `AuditLog { entity: 1, entityId: 1 }` | Supports "show me the history of this specific appointment" |
| `AuditLog { createdAt: -1 }` | Supports the default recency-sorted audit trail view |
| `RefreshToken { expiresAt: 1 }` (TTL) | Automatically purges expired tokens, keeping the collection from growing unbounded |

Indexes were chosen based on the **actual query patterns the API endpoints run**, not
speculatively — each one maps directly to a `find()`/`sort()` shape used somewhere in
`services/`.

---

## 5. What security measures did you implement?

- **Password hashing** with bcrypt (cost factor 10), never stored or returned in plain
  text; the `password` field is `select: false` by default on the `User` model so it's
  never accidentally included in a query response.
- **JWT access + refresh tokens**, short-lived access tokens (15 min) to limit the
  exposure window if one is intercepted, with refresh tokens tracked server-side (in
  the `RefreshToken` collection) so they can be explicitly revoked on logout — a
  stateless-only JWT scheme can't support real logout.
- **Refresh token rotation**: every refresh call revokes the old token and issues a new
  one, limiting the usefulness of a leaked refresh token to a single use window.
- **RBAC middleware** (`authorize(...)`) on every protected route, plus additional
  **query-level scoping** in services (e.g. a Doctor's appointment list is forcibly
  filtered to their own appointments in the service layer, not just hidden in the UI —
  so it can't be bypassed by manipulating query parameters).
- **Input validation** on every mutating endpoint via Zod schemas, run through a
  generic `validate`/`validateQuery` middleware before the controller ever runs.
- **Environment variables** for all secrets and configuration — no hardcoded secrets,
  connection strings, or credentials in source.
- **CORS locked to the known frontend origin**, with `credentials: true` only for
  that origin — not a wildcard.
- **httpOnly cookies** for the refresh token (inaccessible to JavaScript, mitigating
  XSS-based token theft), while the short-lived access token is kept in memory on the
  frontend (never `localStorage`), so a page refresh clears it and it isn't
  persistently exposed to any injected script.
- **Centralized error handler** that never leaks stack traces or internal error
  details in production (`NODE_ENV === "development"` gate on `meta.stack`), and
  consistent HTTP status codes throughout (400/401/403/404/409/500).

---

## 6. What performance optimizations did you apply?

- **Database indexes** matched directly to query patterns (see above) — the single
  highest-impact optimization available, since it changes query complexity rather than
  just reducing constant-factor overhead.
- **Server-side pagination** on both the appointment list and audit log endpoints —
  the client never requests or receives more documents than it can display, and total
  counts are computed via `countDocuments()` run in parallel with the actual fetch
  (`Promise.all`) rather than sequentially.
- **`.lean()` on read-only list queries** (appointment list, audit log list) — skips
  Mongoose's document hydration/change-tracking overhead for data that's never
  going to be saved back, which matters most exactly on the highest-traffic read paths.
- **`React.memo`-friendly component boundaries** and React Query's built-in caching —
  repeated navigations to the same doctor/date slot view, or the same filtered
  appointment list, are served from cache rather than refetched, and `staleTime` is
  set deliberately longer for rarely-changing data (the doctor list) than for
  frequently-changing data (slots, appointments).
- **Debounced search inputs** (patient search, appointment search) — avoids firing a
  network request on every keystroke, only after the user pauses typing.
- **Room-scoped Socket.IO broadcasts** (`doctor:<id>:date:<date>`) instead of a global
  broadcast to all connected clients — event volume scales with actual relevant
  viewers, not total connected users, which matters significantly as concurrent users
  grow.
- **`keepPreviousData`/`placeholderData`** on paginated queries — avoids a jarring
  empty-state flash while a new page or filter is loading.

---

## 7. If this application needed to support millions of appointments, what architectural changes would you make?

- **Sharding the `Appointment` collection**, most naturally by `doctor` or by a
  composite of `doctor + date range`, since almost every query already filters by
  doctor and/or date — this keeps shard queries targeted rather than scatter-gather.
- **Moving the patient-name/mobile search** off the current two-step
  (`Patient.find` → `Appointment.find({ patient: { $in: [...] } })`) approach into a
  proper search solution — either a MongoDB Atlas Search index, or an external search
  engine (Elasticsearch/OpenSearch) if search needs grow (fuzzy matching, typo
  tolerance) beyond what a database index handles well.
- **Read replicas** for the appointment list/search/audit-log endpoints, since these
  are read-heavy and can tolerate very slight replication lag, freeing the primary for
  write-heavy booking traffic.
- **Caching layer (Redis)** for slot-availability lookups on high-traffic doctor/date
  combinations — slot generation itself is cheap (pure function), but the "which slots
  are booked" query would benefit from a short-TTL cache invalidated on write, reducing
  load on the primary during peak booking windows (e.g. Monday mornings).
- **Splitting the monolithic API into services** (Appointments, Scheduling, Patients,
  Audit) once team size and deployment cadence justify it — at millions of
  appointments, the operational profile of "booking a slot" (write-heavy, needs strong
  consistency) and "viewing the audit trail" (read-heavy, can be eventually consistent)
  diverge enough to benefit from independent scaling and deployment.
- **Moving audit logging to an async queue** (e.g., publish to a message queue,
  consumed by a separate writer) rather than an in-process `await AuditLog.create()` —
  at high write volume, decoupling this from the request/response cycle further
  reduces booking-path latency, beyond the current fire-and-forget pattern.
- **Archiving old appointments** (e.g., completed/cancelled appointments older than N
  years) to cold storage, since EMR data typically has long-term retention
  requirements but old records are rarely queried — keeping the hot collection smaller
  keeps indexes smaller and faster.
- **Re-evaluating the unique-index double-booking guarantee under sharding** — a
  unique index only guarantees uniqueness within a single shard unless it's also the
  shard key (or a prefix of it), so the concurrency design would need `doctor` (or
  `doctor+date`) as the shard key to preserve the current guarantee at scale.
