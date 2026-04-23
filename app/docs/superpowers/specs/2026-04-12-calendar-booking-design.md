# Calendar & Booking Feature — Design Spec
**Date:** 2026-04-12  
**Project:** Larinova MVP Web App  
**Author:** Gabriel Antony Xaviour

---

## Overview

Two new surfaces:
1. **Doctor Calendar page** — authenticated, in the sidebar. Month/week/day calendar of appointments, availability editor, booking page preview, analytics.
2. **Public Booking page** — unauthenticated, shareable link per doctor. Cal.com-style two-panel UX for scheduling video or in-person appointments.

---

## 1. Architecture & Data Flow

### Slot Generation (Approach A — Static Weekly Template)
No pre-generated slot rows. Available slots computed on-demand:
1. Fetch doctor's weekly availability template for the requested day of week
2. Fetch already-booked appointments for that date
3. Subtract booked slots from template → return open windows

### Booking Handle
- Auto-generated on first Calendar page visit if null: `slugify(doctor.full_name)` → e.g. `dr-gabriel-xavier`
- If taken, append 4-digit random suffix: `dr-gabriel-xavier-4821`
- Doctor can customize in the Booking Page tab
- Validation: lowercase, alphanumeric + hyphens, 3–40 chars, unique

### Routes
- `/book/[handle]` — public, no auth, no locale prefix. Outside `[locale]/(protected)` routing tree.
- `/[locale]/(protected)/calendar` — authenticated doctor page, in sidebar.

---

## 2. Database Schema

### Modify `larinova_doctors` — add 4 columns

```sql
booking_handle        TEXT UNIQUE                              -- auto-generated from name, customizable
booking_enabled       BOOLEAN DEFAULT true
slot_duration_minutes INTEGER DEFAULT 30
video_call_link       TEXT                                     -- doctor's Meet/Zoom/Teams link
region                TEXT DEFAULT 'IN' CHECK (region IN ('IN', 'ID'))  -- doctor's practice region
```

### New table: `larinova_doctor_availability`

One row per day per doctor. Stores the weekly schedule template.

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
doctor_id       UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE
day_of_week     INTEGER NOT NULL  -- 0=Sunday, 1=Monday ... 6=Saturday
start_time      TIME NOT NULL     -- e.g. '09:00'
end_time        TIME NOT NULL     -- e.g. '17:00'
is_active       BOOLEAN DEFAULT true
break_start     TIME              -- optional lunch break start
break_end       TIME              -- optional lunch break end
UNIQUE(doctor_id, day_of_week)
```

Default seed on first Calendar page visit: Mon–Fri (days 1–5) 09:00–17:00 active, Sat–Sun inactive.

### New table: `larinova_appointments`

```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
doctor_id        UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE
appointment_date DATE NOT NULL
start_time       TIME NOT NULL
end_time         TIME NOT NULL
type             TEXT NOT NULL CHECK (type IN ('video', 'in_person'))
status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed'))
-- Booker info (no account required)
booker_name      TEXT NOT NULL
booker_email     TEXT NOT NULL
booker_phone     TEXT NOT NULL
booker_age       INTEGER NOT NULL
booker_gender    TEXT NOT NULL CHECK (booker_gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
reason           TEXT NOT NULL
chief_complaint  TEXT NOT NULL
notes            TEXT
created_at       TIMESTAMPTZ DEFAULT now()
```

---

## 3. API Routes

### Public (no auth)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/booking/[handle]` | Doctor profile + availability template (for building the calendar) |
| GET | `/api/booking/[handle]/slots?date=YYYY-MM-DD` | Available slots for a specific date |
| POST | `/api/booking/[handle]/appointments` | Create appointment + trigger confirmation emails |

### Authenticated (doctor only)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/calendar/appointments?from=&to=` | Doctor's appointments in date range |
| PATCH | `/api/calendar/appointments/[id]` | Update status (complete/cancel) |
| GET | `/api/calendar/availability` | Read weekly schedule |
| PUT | `/api/calendar/availability` | Save weekly schedule |
| PUT | `/api/calendar/handle` | Update booking handle (validates uniqueness) |

---

## 4. File Structure

```
app/
├── book/
│   └── [handle]/
│       ├── page.tsx              ← metadata + shell, calls API for doctor info
│       └── BookingClient.tsx     ← full client component
├── [locale]/
│   └── (protected)/
│       └── calendar/
│           └── page.tsx          ← authenticated calendar page
│
api/
├── booking/
│   └── [handle]/
│       ├── route.ts              ← GET doctor info
│       ├── slots/route.ts        ← GET available slots
│       └── appointments/route.ts ← POST create appointment
├── calendar/
│   ├── appointments/route.ts         ← GET list
│   ├── appointments/[id]/route.ts    ← PATCH status (complete/cancel)
│   ├── availability/route.ts         ← GET + PUT
│   └── handle/route.ts               ← PUT update handle

components/
├── calendar/
│   ├── CalendarPage.tsx          ← tabbed orchestrator
│   ├── CalendarTab.tsx           ← month/week/day view
│   ├── AvailabilityTab.tsx       ← weekly schedule editor
│   ├── BookingPageTab.tsx        ← preview + handle + link
│   ├── AnalyticsTab.tsx          ← stats + chart
│   └── AppointmentEvent.tsx      ← event block in calendar view
└── booking/
    ├── DoctorCard.tsx            ← left panel
    ├── SlotPicker.tsx            ← right panel step 1
    └── BookingForm.tsx           ← right panel step 2
```

---

## 5. Public Booking Page UX (`/book/[handle]`)

### Layout
Two-panel, full viewport height. No Larinova nav. Minimal footer: "Powered by Larinova".

### Left Panel (~320px, fixed)
- Doctor avatar: DiceBear `shapes` style, seeded from doctor ID
- Doctor name, specialization, clinic name
- Appointment type selector: two cards
  - 📹 **Video Call** — `[slot_duration_minutes]` min
  - 🏥 **In-Person Visit** — `[slot_duration_minutes]` min
  (duration shown dynamically from doctor's `slot_duration_minutes`)
- Detected timezone (browser `Intl`)
- If `booking_enabled = false`: "This doctor is not currently accepting bookings." — right panel hidden

### Right Panel (scrollable)

**Step 1 — Date + Slot Selection**
- Month calendar; available days clickable, past/off/full days greyed
- Click day → slot grid below (30-min windows, e.g. 09:00, 09:30…)
- Booked slots shown as disabled/struck through
- Selected slot highlighted in indigo

**Step 2 — Booking Form** (slides in after slot selected, replaces slot grid)
- Back arrow → returns to slot selection
- Summary chip at top: date, time, type
- Required fields: Full Name, Email, Phone, Age, Gender (dropdown), Reason for Visit, Chief Complaint (textarea)
- Optional: Additional Notes
- **Payment card** (disabled, purely decorative):
  - Lock icon + "Consultation Fee Payment — Coming Soon"
  - Greyed out, no interaction possible
- "Confirm Appointment" CTA

**Confirmation Screen** (replaces both panels)
- Checkmark animation
- "Appointment Confirmed!"
- Summary: doctor, date, time, type
- "Confirmation sent to [email]"
- "Add to Google Calendar" button (Google Calendar URL with pre-filled details)

### Error States
- Handle not found → dedicated 404 with "This booking link doesn't exist"
- All slots taken for selected day → "No available slots on this date — please pick another day"
- Email failure → appointment confirmed, error logged server-side, silent retry

---

## 6. Doctor Calendar Page UX (`/[locale]/(protected)/calendar`)

### Top Bar
- Page title: "Calendar"
- "View Booking Page →" (opens `/book/[handle]` in new tab)
- "Copy Link" button

### Tab 1 — Calendar
- Month/Week/Day view switcher + prev/next + "Today"
- Appointment event blocks: indigo for video 📹, cyan for in-person 🏥
- Click event → popover with: booker name, email, phone, age, gender, reason, chief complaint, type, time. Actions: "Mark Complete" / "Cancel"
- Empty state: "No appointments yet. Share your booking link to get started."

### Tab 2 — Availability
- 7 day rows (Sun–Sat)
- Each row: day name + on/off toggle + start time picker + end time picker
- "Add break" per active day (optional lunch block — break_start / break_end)
- "Slot duration" dropdown at top: 15 / 30 / 45 / 60 min (updates `slot_duration_minutes` on doctor)
- "Save Changes" button — writes to `larinova_doctor_availability`
- Default state: Mon–Fri 09:00–17:00 active; Sat–Sun off

### Tab 3 — Booking Page
- Left (~40%): handle editor (current handle, editable, uniqueness validated on blur), "Accept Bookings" toggle, video call link input
- Right (~60%): live iframe preview of `/book/[handle]`
- "Copy booking link" + "Open in new tab" buttons

### Tab 4 — Analytics
- Stat cards: Total bookings (all time), This month, Video vs In-person (%), Completion rate
- Bar chart: bookings per week (last 8 weeks)
- Upcoming appointments list (next 5, with booker name + time + type)

---

## 7. Email Notifications

Both sent via existing Resend setup in `lib/resend/email.ts`, from `hello@larinova.com`.

### To Booker — Confirmation
- **Subject:** "Your appointment with Dr. [Name] is confirmed"
- **Body:** Date, time, type, doctor name, clinic. If video: doctor's video call link. If in-person: clinic address.
- "Add to Google Calendar" link

### To Doctor — New Booking
- **Subject:** "New appointment — [Booker Name], [Date] [Time]"
- **Body:** Booker name, email, phone, age, gender, reason, chief complaint, type, date, time.

---

## 8. i18n

### Sidebar
New key in `navigation` namespace:
- `in.json`: `"calendar": "Calendar"`
- `id.json`: `"calendar": "Kalender"`

### Doctor Calendar Page
New `calendar` namespace in both locale files covering: tab labels, availability editor labels, booking page tab labels, analytics labels, appointment popover actions.

### Public Booking Page — Locale Detection
The `/book/[handle]` route is outside `[locale]` routing. Locale detected client-side:
- `navigator.language` starts with `id` → Bahasa Indonesia
- Otherwise → English
- Date/time formatted with detected locale (`id-ID` or `en-IN`)
- All booking page strings under a new `booking` namespace in both locale files

### Cross-Region Warning
- Each doctor has a region (`IN` or `ID`) on `larinova_doctors`
- Visitor region detected via timezone: `Asia/Jakarta` / `Asia/Makassar` / `Asia/Jayapura` → `ID`; `Asia/Kolkata` → `IN`; unknown → no warning
- If visitor region ≠ doctor region AND appointment type is `in_person`:
  - Show dismissible amber banner at top of booking page
  - EN (visitor is non-ID, doctor is ID): *"Note: This doctor is based in Indonesia. In-person visits require travel to Indonesia."*
  - ID (visitor is non-IN, doctor is IN): *"Catatan: Dokter ini berpraktik di India. Kunjungan langsung memerlukan perjalanan ke India."*
- Banner not shown for video call type (location irrelevant)

---

## 9. Sidebar Update

In `components/layout/Sidebar.tsx`, add Calendar nav item between Tasks and Documents:
```tsx
{ href: '/calendar', label: t('navigation.calendar'), icon: CalendarIcon }
```

---

## 10. Scope Boundaries (Not in v1)

- No rescheduling or rebooking flow (doctor cancels, patient re-books manually)
- No cancellation by booker (doctor manages cancellations only)
- No payment processing (UI placeholder only, "Coming Soon")
- No reminders / follow-up emails
- No recurring appointments
- No waiting list
- Booking page is English-first for cross-region visits only; no full translation of the booking page into languages beyond EN + ID
