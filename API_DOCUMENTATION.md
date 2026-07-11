# API Documentation

Base URL: `http://localhost:5000/api/v1`

All timestamps are ISO 8601. All dates in request/response bodies use `"YYYY-MM-DD"`.
All authenticated endpoints require header: `Authorization: Bearer <accessToken>`.

Every response follows this envelope:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": {},
  "meta": {}
}
```

Errors follow the same envelope with `"success": false` and an appropriate HTTP status
code (`400`, `401`, `403`, `404`, `409`, `500`).

---

## Authentication

### `POST /auth/login`
**Access:** Public

Request:
```json
{ "email": "admin@emr.com", "password": "Admin@123" }
```

Response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": "...", "name": "Super Admin", "email": "admin@emr.com", "role": "superadmin" }
  }
}
```
Also sets an `httpOnly` `refreshToken` cookie.

Errors: `401` invalid credentials.

---

### `POST /auth/refresh`
**Access:** Public (relies on the `refreshToken` cookie)

Response `200`:
```json
{ "success": true, "message": "Token refreshed", "data": { "accessToken": "..." } }
```
Rotates the refresh token (old one is revoked, a new cookie is set).

Errors: `401` missing token, `403` invalid/expired/revoked token.

---

### `POST /auth/logout`
**Access:** Authenticated

Revokes the current refresh token and clears the cookie.

Response `200`:
```json
{ "success": true, "message": "Logged out successfully", "data": {} }
```

---

### `GET /auth/me`
**Access:** Authenticated

Response `200`:
```json
{
  "success": true,
  "message": "Current user fetched",
  "data": { "_id": "...", "name": "Super Admin", "email": "admin@emr.com", "role": "superadmin" }
}
```

---

## Doctors & Schedules

### `POST /doctors`
**Access:** Super Admin only

Request:
```json
{
  "name": "Dr. Anu Nair",
  "email": "anu@emr.com",
  "password": "Doctor@123",
  "department": "Cardiology",
  "specialization": "Interventional Cardiology",
  "phone": "9000000000"
}
```

Response `201`:
```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "doctor": { "_id": "...", "name": "Dr. Anu Nair", "department": "Cardiology" },
    "account": { "id": "...", "email": "anu@emr.com", "role": "doctor" }
  }
}
```

Errors: `409` email already in use, `403` if caller isn't Super Admin.

---

### `GET /doctors?department=`
**Access:** Any authenticated role

Response `200`:
```json
{
  "success": true,
  "message": "Doctors fetched successfully",
  "data": [{ "_id": "...", "name": "Dr. Anu Nair", "department": "Cardiology" }]
}
```

---

### `PUT /doctors/:doctorId/schedule`
**Access:** Super Admin only

Request:
```json
{
  "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "sessions": [
    { "name": "Morning", "startTime": "09:00", "endTime": "12:00" },
    { "name": "Evening", "startTime": "13:00", "endTime": "17:00" }
  ],
  "breaks": [{ "startTime": "12:00", "endTime": "13:00" }],
  "slotDuration": 15
}
```

Response `200`: the saved schedule document.

Errors: `400` invalid/overlapping time ranges, `404` doctor not found.

---

### `GET /doctors/:doctorId/schedule`
**Access:** Any authenticated role

Response `200`: the schedule document, or `404` if none configured yet.

---

## Receptionists

### `POST /receptionists`
**Access:** Super Admin only

Request:
```json
{ "name": "Priya Nair", "email": "priya@emr.com", "password": "Reception@123" }
```

Response `201`:
```json
{
  "success": true,
  "message": "Receptionist created successfully",
  "data": { "id": "...", "name": "Priya Nair", "email": "priya@emr.com", "role": "receptionist" }
}
```

---

## Patients

### `POST /patients`
**Access:** Super Admin, Receptionist

Request:
```json
{ "name": "Ravi Kumar", "mobile": "9876543210", "age": 34, "gender": "Male" }
```

Response `201`: the created patient document.

---

### `GET /patients/search?query=`
**Access:** Super Admin, Receptionist

`query` matches against Patient ID (if valid ObjectId), exact mobile, or partial
case-insensitive name.

Response `200`:
```json
{
  "success": true,
  "message": "Patients fetched successfully",
  "data": [{ "_id": "...", "name": "Ravi Kumar", "mobile": "9876543210" }]
}
```

---

### `GET /patients/:id`
**Access:** All roles

Response `200`: the patient document, or `404`.

---

## Slots

### `GET /slots?doctorId=&date=`
**Access:** Any authenticated role

Response `200`:
```json
{
  "success": true,
  "message": "Slots fetched successfully",
  "data": {
    "date": "2026-07-20",
    "doctor": "66a1...",
    "slots": [
      { "startTime": "09:00", "endTime": "09:15", "status": "available" },
      { "startTime": "09:15", "endTime": "09:30", "status": "booked" }
    ]
  }
}
```
`status` is one of `available`, `booked`, `past`. Slots falling inside a configured
break period are omitted entirely — they never appear in the array.

Errors: `400` for a past date or non-working day (returns empty `slots: []` for a
non-working day rather than an error).

---

## Appointments

### `POST /appointments`
**Access:** Super Admin, Receptionist

Request (existing patient):
```json
{
  "doctorId": "66a1...",
  "department": "Cardiology",
  "date": "2026-07-20",
  "slotStartTime": "09:00",
  "slotEndTime": "09:15",
  "purpose": "Follow-up consultation",
  "patientId": "66a4..."
}
```

Request (new patient — `newPatient` replaces `patientId`):
```json
{
  "doctorId": "66a1...",
  "department": "Cardiology",
  "date": "2026-07-20",
  "slotStartTime": "09:15",
  "slotEndTime": "09:30",
  "newPatient": { "name": "Meena Pillai", "mobile": "9123456780", "age": 29, "gender": "Female" }
}
```

Response `201`: the created appointment, populated with `doctor` and `patient`.

Errors:
- `400` invalid/past slot, or slot doesn't match the doctor's current schedule
- `409` slot was just booked by a concurrent request
- `404` referenced patient/doctor not found

---

### `GET /appointments`
**Access:** All roles (Doctor is automatically scoped to their own appointments,
regardless of any `doctorId` passed)

Query parameters: `doctorId`, `department`, `status`
(`Scheduled`/`Arrived`/`Completed`/`Cancelled`), `dateFrom`, `dateTo`, `search`
(patient name/mobile), `page` (default 1), `limit` (default 10, max 100), `sortBy`
(`date`/`createdAt`/`status`, default `date`), `sortOrder` (`asc`/`desc`, default `desc`).

Response `200`:
```json
{
  "success": true,
  "message": "Appointments fetched successfully",
  "data": [{ "...": "appointment documents" }],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

### `GET /appointments/:id`
**Access:** All roles

Response `200`: a single populated appointment, or `404`.

---

### `PUT /appointments/:id`
**Access:** All roles, field-scoped —

- Super Admin / Receptionist may update `purpose` and/or `notes`.
- Doctor may update `notes` only, and only on an appointment that is their own.

Request:
```json
{ "notes": "BP 130/85, prescribed atenolol" }
```

Response `200`: the updated appointment.

Errors: `400` if editing a `Completed`/`Cancelled` appointment, `403` if a doctor
attempts to set `purpose` or acts on another doctor's appointment.

---

### `POST /appointments/:id/arrive`
**Access:** Super Admin, Receptionist

Transitions `Scheduled → Arrived`.

Response `200`: the updated appointment.

Errors: `400` if the current status doesn't allow this transition (e.g. already
`Completed`).

---

### `POST /appointments/:id/complete`
**Access:** Super Admin, Doctor (own appointments only)

Transitions `Arrived → Completed`.

Errors: `400` invalid transition (e.g. attempting to complete directly from
`Scheduled`), `403` doctor attempting another doctor's appointment.

---

### `DELETE /appointments/:id`
**Access:** Super Admin, Receptionist

Request:
```json
{ "reason": "Patient requested reschedule" }
```

Transitions `Scheduled`/`Arrived` → `Cancelled`. The slot becomes immediately
available for rebooking (enforced by the partial unique index).

Errors: `400` if already in a terminal state (`Completed`/`Cancelled`).

---

## Audit Logs

### `GET /audit-logs`
**Access:** Super Admin only

Query parameters: `user`, `role`, `action`, `entity`, `dateFrom`, `dateTo`, `page`,
`limit`.

Response `200`:
```json
{
  "success": true,
  "message": "Audit logs fetched successfully",
  "data": [
    {
      "_id": "...",
      "user": { "_id": "...", "name": "Priya Nair", "email": "priya@emr.com", "role": "receptionist" },
      "role": "receptionist",
      "action": "APPOINTMENT_CREATED",
      "entity": "Appointment",
      "entityId": "...",
      "createdAt": "2026-07-12T10:15:00.000Z"
    }
  ],
  "meta": { "total": 130, "page": 1, "limit": 20, "totalPages": 7 }
}
```

Logged actions: `LOGIN`, `APPOINTMENT_CREATED`, `APPOINTMENT_UPDATED`,
`APPOINTMENT_ARRIVED`, `APPOINTMENT_COMPLETED`, `APPOINTMENT_CANCELLED`.

---

## Real-Time Events (Socket.IO)

Connect to the Socket.IO server at the base host (`http://localhost:5000`), passing the
access token during the handshake:

```js
const socket = io("http://localhost:5000", { auth: { token: accessToken } });
```

**Client → Server events**

| Event | Payload | Purpose |
|---|---|---|
| `scheduler:join` | `{ doctorId, date }` | Join the room for a specific doctor/date view |
| `scheduler:leave` | `{ doctorId, date }` | Leave that room |

**Server → Client events** (emitted to the relevant `doctor:<id>:date:<date>` room)

| Event | Payload | Fired when |
|---|---|---|
| `appointment:created` | Appointment summary object | A new appointment is booked |
| `appointment:updated` | Appointment summary object | Purpose/notes updated, or marked arrived/completed |
| `appointment:cancelled` | Appointment summary object | An appointment is cancelled |
