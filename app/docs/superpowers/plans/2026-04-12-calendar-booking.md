# Calendar & Booking Feature — Implementation Plan

> **For agentic workers:** Pick ONE of three sanctioned execution paths:
> 1. **`superpowers:executing-plans`** — sequential execution with built-in checkpoints (default for most plans)
> 2. **cmux-teams** — parallel execution across 3+ independent workstreams via cmux tabs (see `~/.claude/rules/cmux-teams.md`)
> 3. **`superpowers:subagent-driven-development`** — fresh subagent per task, fastest iteration (for plans with clear task boundaries)
>
> **Fresh session guidance**: This plan has 17 tasks, a schema migration, and spans DB/API/frontend — use a fresh Claude Code session.
>
> **Testing flow**: No TDD in project CLAUDE.md. Flow is: implement → `npx tsc --noEmit` → visual verify in browser via `mcp__playwright__*` → commit.
>
> **Verification between tasks**: invoke `superpowers:verification-before-completion` before marking each task done.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a doctor Calendar page (authenticated, 4 tabs) and a public `/book/[handle]` booking page with cal.com-style UX, two appointment types, auto-confirm with email, and cross-region warnings.

**Architecture:** Static weekly availability template stored in `larinova_doctor_availability`. Slots computed on-demand by subtracting booked rows in `larinova_appointments` from the template. Public route `/book/[handle]` lives outside `[locale]` routing. Doctor sets a custom handle (auto-generated from name on first visit).

**Tech Stack:** Next.js App Router, Supabase (server + service-role clients), Resend, Tailwind, shadcn/ui, next-intl, recharts

**Project flow reference:** Read `app/CLAUDE.md`. No TDD — implement, typecheck, visual verify, commit.

---

## File Map

**New files:**
- `app/book/[handle]/page.tsx` — public booking page shell
- `app/book/[handle]/BookingClient.tsx` — full booking UI client component
- `app/[locale]/(protected)/calendar/page.tsx` — authenticated calendar page
- `app/api/booking/[handle]/route.ts` — GET doctor info for booking page
- `app/api/booking/[handle]/slots/route.ts` — GET available slots for a date
- `app/api/booking/[handle]/appointments/route.ts` — POST create appointment
- `app/api/calendar/appointments/route.ts` — GET doctor's appointments
- `app/api/calendar/appointments/[id]/route.ts` — PATCH appointment status
- `app/api/calendar/availability/route.ts` — GET + PUT weekly schedule
- `app/api/calendar/handle/route.ts` — PUT update booking handle
- `lib/supabase/admin.ts` — service-role Supabase client (bypasses RLS)
- `lib/booking/slots.ts` — slot generation + availability math utilities
- `lib/booking/handle.ts` — booking handle slug generator
- `components/booking/DoctorCard.tsx` — left panel of booking page
- `components/booking/SlotPicker.tsx` — right panel step 1 (calendar + slots)
- `components/booking/BookingForm.tsx` — right panel step 2 (form + payment stub)
- `components/calendar/CalendarPage.tsx` — 4-tab orchestrator
- `components/calendar/CalendarTab.tsx` — month/week/day calendar view
- `components/calendar/AppointmentEvent.tsx` — event block in calendar
- `components/calendar/AvailabilityTab.tsx` — weekly schedule editor
- `components/calendar/BookingPageTab.tsx` — handle editor + preview
- `components/calendar/AnalyticsTab.tsx` — stats + recharts bar chart

**Modified files:**
- `middleware.ts` — exclude `/book` from locale routing
- `APPLY_MIGRATIONS.sql` — append new SQL (also apply manually in Supabase console)
- `components/layout/Sidebar.tsx` — add Calendar nav item
- `messages/in.json` — add `navigation.calendar` + `calendar` + `booking` namespaces
- `messages/id.json` — same in Indonesian

---

### Task 1: Database Migration

**Files:**
- Modify: `APPLY_MIGRATIONS.sql`
- Apply via Supabase SQL Editor

- [ ] **Step 1: Append SQL to APPLY_MIGRATIONS.sql**

Add to the end of `APPLY_MIGRATIONS.sql`:

```sql
-- ============================================================
-- Calendar & Booking Feature Migration (2026-04-12)
-- ============================================================

-- Add columns to larinova_doctors
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS booking_handle TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS video_call_link TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'IN' CHECK (region IN ('IN', 'ID'));

-- Update existing doctors' region based on locale
UPDATE larinova_doctors SET region = 'ID' WHERE locale = 'id';
UPDATE larinova_doctors SET region = 'IN' WHERE locale != 'id' OR locale IS NULL;

-- Weekly availability template
CREATE TABLE IF NOT EXISTS larinova_doctor_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  break_start     TIME,
  break_end       TIME,
  UNIQUE(doctor_id, day_of_week)
);

-- Booked appointments
CREATE TABLE IF NOT EXISTS larinova_appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id        UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('video', 'in_person')),
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  booker_name      TEXT NOT NULL,
  booker_email     TEXT NOT NULL,
  booker_phone     TEXT NOT NULL,
  booker_age       INTEGER NOT NULL,
  booker_gender    TEXT NOT NULL
                     CHECK (booker_gender IN ('male','female','other','prefer_not_to_say')),
  reason           TEXT NOT NULL,
  chief_complaint  TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE larinova_doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_appointments ENABLE ROW LEVEL SECURITY;

-- Availability: doctors manage their own; public can read (needed for booking page API)
CREATE POLICY "doctors_manage_availability" ON larinova_doctor_availability
  FOR ALL USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "public_read_availability" ON larinova_doctor_availability
  FOR SELECT USING (true);

-- Appointments: doctors see their own; public can insert (booking) and read own by id
CREATE POLICY "doctors_view_appointments" ON larinova_appointments
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "doctors_update_appointments" ON larinova_appointments
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM larinova_doctors WHERE user_id = auth.uid())
  );
CREATE POLICY "public_insert_appointments" ON larinova_appointments
  FOR INSERT WITH CHECK (true);
```

- [ ] **Step 2: Apply migration in Supabase console**

Open Supabase dashboard → SQL Editor → paste the SQL block above → Run.
Verify with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'larinova_doctors' AND column_name = 'booking_handle';`
Expected: 1 row returned.

- [ ] **Step 3: Commit**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
git add APPLY_MIGRATIONS.sql
git commit -m "feat: add calendar & booking DB migration"
```

---

### Task 2: Middleware + i18n + Sidebar

**Files:**
- Modify: `middleware.ts`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `messages/in.json`
- Modify: `messages/id.json`

- [ ] **Step 1: Exclude `/book` from middleware matcher**

In `middleware.ts`, update the `config.matcher` regex to also skip `book`:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|wav|mp3)$|api|test|book).*)",
  ],
};
```

- [ ] **Step 2: Add Calendar nav item to Sidebar.tsx**

In `components/layout/Sidebar.tsx`, add `Calendar` to the imports from lucide-react:
```typescript
import { Home, Users, LogOut, Stethoscope, CheckSquare, FileText, CreditCard, Zap, UserCircle, Calendar } from "lucide-react";
```

Then insert after the Tasks nav link (after the `CheckSquare` entry):
```typescript
<SidebarNavLink
  href="/calendar"
  icon={<Calendar className="w-5 h-5 flex-shrink-0" />}
  label={t("navigation.calendar")}
  active={isActive("/calendar") || pathname.includes("/calendar")}
  open={open}
/>
```

- [ ] **Step 3: Add i18n keys to messages/in.json**

Add `"calendar": "Calendar"` to the `"navigation"` object.

Add new top-level namespace after `"navigation"`:
```json
"calendar": {
  "tabs": {
    "calendar": "Calendar",
    "availability": "Availability",
    "bookingPage": "Booking Page",
    "analytics": "Analytics"
  },
  "availability": {
    "title": "Your Availability",
    "slotDuration": "Slot duration",
    "slotDurationMinutes": "{n} min",
    "addBreak": "Add break",
    "removeBreak": "Remove break",
    "breakTime": "Break time",
    "saveChanges": "Save changes",
    "saved": "Availability saved",
    "days": {
      "0": "Sunday",
      "1": "Monday",
      "2": "Tuesday",
      "3": "Wednesday",
      "4": "Thursday",
      "5": "Friday",
      "6": "Saturday"
    }
  },
  "bookingPage": {
    "title": "Booking Page",
    "yourLink": "Your booking link",
    "copyLink": "Copy link",
    "copied": "Copied!",
    "openNewTab": "Open in new tab",
    "acceptBookings": "Accept bookings",
    "videoCallLink": "Video call link",
    "videoCallLinkPlaceholder": "https://meet.google.com/...",
    "handle": "Booking handle",
    "handleTaken": "This handle is already taken",
    "handleAvailable": "Handle is available",
    "saveHandle": "Save handle"
  },
  "analytics": {
    "title": "Analytics",
    "totalBookings": "Total bookings",
    "thisMonth": "This month",
    "completionRate": "Completion rate",
    "videoVsInPerson": "Video vs In-person",
    "upcomingAppointments": "Upcoming appointments",
    "noUpcoming": "No upcoming appointments",
    "weeklyBookings": "Weekly bookings (last 8 weeks)"
  },
  "appointments": {
    "markComplete": "Mark complete",
    "cancel": "Cancel appointment",
    "cancelConfirm": "Are you sure you want to cancel this appointment?",
    "noAppointments": "No appointments yet",
    "noAppointmentsHint": "Share your booking link to get started",
    "viewBookingPage": "View booking page"
  }
},
"booking": {
  "videoCall": "Video Call",
  "inPerson": "In-Person Visit",
  "minutes": "{n} min",
  "timezone": "Timezone",
  "selectDate": "Select a date",
  "selectTime": "Select a time",
  "noSlotsOnDate": "No available slots on this date — please pick another day",
  "notAccepting": "This doctor is not currently accepting bookings.",
  "doctorNotFound": "This booking link does not exist.",
  "form": {
    "title": "Your details",
    "fullName": "Full Name",
    "email": "Email",
    "phone": "Phone",
    "age": "Age",
    "gender": "Gender",
    "genderOptions": {
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "prefer_not_to_say": "Prefer not to say"
    },
    "reason": "Reason for visit",
    "chiefComplaint": "Chief complaint",
    "chiefComplaintPlaceholder": "Describe your main symptoms or concern",
    "notes": "Additional notes (optional)",
    "paymentTitle": "Consultation Fee Payment",
    "paymentComingSoon": "Coming Soon",
    "confirmButton": "Confirm Appointment"
  },
  "confirmation": {
    "title": "Appointment Confirmed!",
    "subtitle": "A confirmation has been sent to {email}",
    "addToCalendar": "Add to Google Calendar",
    "summary": "Appointment Summary"
  },
  "crossRegionWarning": {
    "doctorInIndonesia": "Note: This doctor is based in Indonesia. In-person visits require travel to Indonesia.",
    "doctorInIndia": "Note: This doctor is based in India. In-person visits require travel to India."
  }
}
```

- [ ] **Step 4: Add same keys to messages/id.json**

```json
"calendar": "Kalender"
```
(in the `navigation` object)

Add top-level `"calendar"` namespace (Indonesian translations):
```json
"calendar": {
  "tabs": {
    "calendar": "Kalender",
    "availability": "Ketersediaan",
    "bookingPage": "Halaman Booking",
    "analytics": "Analitik"
  },
  "availability": {
    "title": "Ketersediaan Anda",
    "slotDuration": "Durasi slot",
    "slotDurationMinutes": "{n} menit",
    "addBreak": "Tambah istirahat",
    "removeBreak": "Hapus istirahat",
    "breakTime": "Waktu istirahat",
    "saveChanges": "Simpan perubahan",
    "saved": "Ketersediaan disimpan",
    "days": {
      "0": "Minggu",
      "1": "Senin",
      "2": "Selasa",
      "3": "Rabu",
      "4": "Kamis",
      "5": "Jumat",
      "6": "Sabtu"
    }
  },
  "bookingPage": {
    "title": "Halaman Booking",
    "yourLink": "Link booking Anda",
    "copyLink": "Salin link",
    "copied": "Tersalin!",
    "openNewTab": "Buka di tab baru",
    "acceptBookings": "Terima booking",
    "videoCallLink": "Link video call",
    "videoCallLinkPlaceholder": "https://meet.google.com/...",
    "handle": "Handle booking",
    "handleTaken": "Handle ini sudah digunakan",
    "handleAvailable": "Handle tersedia",
    "saveHandle": "Simpan handle"
  },
  "analytics": {
    "title": "Analitik",
    "totalBookings": "Total booking",
    "thisMonth": "Bulan ini",
    "completionRate": "Tingkat penyelesaian",
    "videoVsInPerson": "Video vs Tatap muka",
    "upcomingAppointments": "Janji temu mendatang",
    "noUpcoming": "Tidak ada janji temu mendatang",
    "weeklyBookings": "Booking mingguan (8 minggu terakhir)"
  },
  "appointments": {
    "markComplete": "Tandai selesai",
    "cancel": "Batalkan janji",
    "cancelConfirm": "Apakah Anda yakin ingin membatalkan janji ini?",
    "noAppointments": "Belum ada janji temu",
    "noAppointmentsHint": "Bagikan link booking Anda untuk mulai",
    "viewBookingPage": "Lihat halaman booking"
  }
},
"booking": {
  "videoCall": "Video Call",
  "inPerson": "Kunjungan Langsung",
  "minutes": "{n} menit",
  "timezone": "Zona waktu",
  "selectDate": "Pilih tanggal",
  "selectTime": "Pilih waktu",
  "noSlotsOnDate": "Tidak ada slot tersedia pada tanggal ini — pilih tanggal lain",
  "notAccepting": "Dokter ini sedang tidak menerima booking.",
  "doctorNotFound": "Link booking ini tidak ada.",
  "form": {
    "title": "Data diri",
    "fullName": "Nama Lengkap",
    "email": "Email",
    "phone": "Telepon",
    "age": "Usia",
    "gender": "Jenis kelamin",
    "genderOptions": {
      "male": "Laki-laki",
      "female": "Perempuan",
      "other": "Lainnya",
      "prefer_not_to_say": "Tidak ingin menyebutkan"
    },
    "reason": "Alasan kunjungan",
    "chiefComplaint": "Keluhan utama",
    "chiefComplaintPlaceholder": "Jelaskan gejala atau keluhan utama Anda",
    "notes": "Catatan tambahan (opsional)",
    "paymentTitle": "Pembayaran Biaya Konsultasi",
    "paymentComingSoon": "Segera Hadir",
    "confirmButton": "Konfirmasi Janji"
  },
  "confirmation": {
    "title": "Janji Dikonfirmasi!",
    "subtitle": "Konfirmasi telah dikirim ke {email}",
    "addToCalendar": "Tambah ke Google Calendar",
    "summary": "Ringkasan Janji"
  },
  "crossRegionWarning": {
    "doctorInIndonesia": "Catatan: Dokter ini berpraktik di Indonesia. Kunjungan langsung memerlukan perjalanan ke Indonesia.",
    "doctorInIndia": "Catatan: Dokter ini berpraktik di India. Kunjungan langsung memerlukan perjalanan ke India."
  }
}
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
npx tsc --noEmit
```
Expected: no errors related to new nav item.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts components/layout/Sidebar.tsx messages/in.json messages/id.json
git commit -m "feat: add Calendar nav item, i18n keys, exclude /book from middleware"
```

---

### Task 3: Supabase Admin Client + Booking Utilities

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `lib/booking/slots.ts`
- Create: `lib/booking/handle.ts`

- [ ] **Step 1: Create `lib/supabase/admin.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 2: Create `lib/booking/slots.ts`**

```typescript
/**
 * Generate all possible time slot start times for a given availability window.
 * Returns strings like "09:00", "09:30", "10:00", etc.
 */
export function generateTimeSlots(
  startTime: string,       // "09:00"
  endTime: string,         // "17:00"
  slotDurationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null
): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const breakS = breakStart ? toMinutes(breakStart) : null;
  const breakE = breakEnd ? toMinutes(breakEnd) : null;

  const slots: string[] = [];
  for (let t = start; t + slotDurationMinutes <= end; t += slotDurationMinutes) {
    // Skip slots that overlap the break window
    if (breakS !== null && breakE !== null) {
      if (t < breakE && t + slotDurationMinutes > breakS) continue;
    }
    slots.push(toTime(t));
  }
  return slots;
}

/**
 * Remove already-booked slots from the full list.
 * bookedStartTimes: array of "HH:MM" strings (from DB start_time col, truncated to 5 chars).
 */
export function filterAvailableSlots(
  allSlots: string[],
  bookedStartTimes: string[]
): string[] {
  const booked = new Set(bookedStartTimes.map((t) => t.substring(0, 5)));
  return allSlots.filter((s) => !booked.has(s));
}

/**
 * Detect visitor region from timezone string.
 * Returns 'ID', 'IN', or null if unknown.
 */
export function detectRegionFromTimezone(tz: string): "IN" | "ID" | null {
  const idZones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Pontianak"];
  if (idZones.includes(tz)) return "ID";
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
  return null;
}
```

- [ ] **Step 3: Create `lib/booking/handle.ts`**

```typescript
/**
 * Generate a URL-safe booking handle from a doctor's full name.
 * e.g. "Dr. Gabriel Xavier" → "dr-gabriel-xavier"
 */
export function generateHandle(fullName: string): string {
  return (
    "dr-" +
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 32)
  );
}

/**
 * Append a random 4-digit suffix to a handle.
 * Used when the base handle is already taken.
 */
export function handleWithSuffix(base: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${base.substring(0, 32)}-${suffix}`;
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/admin.ts lib/booking/slots.ts lib/booking/handle.ts
git commit -m "feat: add admin supabase client and booking utilities"
```

---

### Task 4: Public Booking API — GET Doctor Info + GET Slots

**Files:**
- Create: `app/api/booking/[handle]/route.ts`
- Create: `app/api/booking/[handle]/slots/route.ts`

- [ ] **Step 1: Create `app/api/booking/[handle]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const supabase = createAdminClient();

  const { data: doctor, error } = await supabase
    .from("larinova_doctors")
    .select(
      "id, full_name, specialization, clinic_name, clinic_address, profile_image_url, booking_enabled, slot_duration_minutes, video_call_link, region"
    )
    .eq("booking_handle", handle)
    .single();

  if (error || !doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const { data: availability } = await supabase
    .from("larinova_doctor_availability")
    .select("day_of_week, start_time, end_time, is_active, break_start, break_end")
    .eq("doctor_id", doctor.id)
    .order("day_of_week");

  return NextResponse.json({ doctor, availability: availability ?? [] });
}
```

- [ ] **Step 2: Create `app/api/booking/[handle]/slots/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTimeSlots, filterAvailableSlots } from "@/lib/booking/slots";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, slot_duration_minutes, booking_enabled")
    .eq("booking_handle", handle)
    .single();

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }
  if (!doctor.booking_enabled) {
    return NextResponse.json({ slots: [] });
  }

  // Day of week for the requested date (0=Sun)
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  const { data: avail } = await supabase
    .from("larinova_doctor_availability")
    .select("start_time, end_time, is_active, break_start, break_end")
    .eq("doctor_id", doctor.id)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!avail || !avail.is_active) {
    return NextResponse.json({ slots: [] });
  }

  const allSlots = generateTimeSlots(
    avail.start_time.substring(0, 5),
    avail.end_time.substring(0, 5),
    doctor.slot_duration_minutes ?? 30,
    avail.break_start,
    avail.break_end
  );

  const { data: booked } = await supabase
    .from("larinova_appointments")
    .select("start_time")
    .eq("doctor_id", doctor.id)
    .eq("appointment_date", date)
    .in("status", ["confirmed", "completed"]);

  const bookedTimes = (booked ?? []).map((b) => b.start_time);
  const available = filterAvailableSlots(allSlots, bookedTimes);

  return NextResponse.json({ slots: available });
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Smoke test with curl**

Start the dev server: `npm run dev`

```bash
# First, get the booking handle of an existing doctor from Supabase dashboard
# Then test:
curl "http://localhost:3000/api/booking/HANDLE_HERE"
# Expected: { doctor: {...}, availability: [...] }

curl "http://localhost:3000/api/booking/HANDLE_HERE/slots?date=2026-04-14"
# Expected: { slots: ["09:00", "09:30", ...] } (empty if no availability seeded yet)
```

- [ ] **Step 5: Commit**

```bash
git add app/api/booking/
git commit -m "feat: add public booking GET endpoints (doctor info + slots)"
```

---

### Task 5: Email Templates

**Files:**
- Modify: `lib/resend/email.ts`

- [ ] **Step 1: Read the current email.ts to understand the pattern**

Read `lib/resend/email.ts` fully before editing to match the existing function signature and HTML style.

- [ ] **Step 2: Append two new exported functions to `lib/resend/email.ts`**

```typescript
// ─── Appointment Confirmation to Booker ────────────────────────────────────

export async function sendAppointmentConfirmation({
  to,
  bookerName,
  doctorName,
  clinicName,
  clinicAddress,
  appointmentDate,
  startTime,
  appointmentType,
  videoCallLink,
  googleCalendarUrl,
}: {
  to: string;
  bookerName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress?: string | null;
  appointmentDate: string; // "April 14, 2026"
  startTime: string;       // "09:00 AM"
  appointmentType: "video" | "in_person";
  videoCallLink?: string | null;
  googleCalendarUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const locationLine =
    appointmentType === "video"
      ? videoCallLink
        ? `<p>Join via: <a href="${videoCallLink}">${videoCallLink}</a></p>`
        : `<p>Your doctor will send you the video call link.</p>`
      : `<p>Location: ${clinicAddress ?? clinicName}</p>`;

  await resend.emails.send({
    from: "Larinova <hello@larinova.com>",
    to,
    subject: `Your appointment with ${doctorName} is confirmed`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Appointment Confirmed</h2>
        <p>Hi ${bookerName},</p>
        <p>Your appointment has been confirmed.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Doctor</td><td style="padding:6px;font-weight:600;">${doctorName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Date</td><td style="padding:6px;">${appointmentDate}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Time</td><td style="padding:6px;">${startTime}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Type</td><td style="padding:6px;">${appointmentType === "video" ? "Video Call" : "In-Person Visit"}</td></tr>
        </table>
        ${locationLine}
        <a href="${googleCalendarUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">Add to Google Calendar</a>
        <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Powered by Larinova</p>
      </div>
    `,
  });
}

// ─── New Booking Notification to Doctor ────────────────────────────────────

export async function sendDoctorNewBookingNotification({
  to,
  doctorName,
  bookerName,
  bookerEmail,
  bookerPhone,
  bookerAge,
  bookerGender,
  reason,
  chiefComplaint,
  appointmentDate,
  startTime,
  appointmentType,
}: {
  to: string;
  doctorName: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  bookerAge: number;
  bookerGender: string;
  reason: string;
  chiefComplaint: string;
  appointmentDate: string;
  startTime: string;
  appointmentType: "video" | "in_person";
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Larinova <hello@larinova.com>",
    to,
    subject: `New appointment — ${bookerName}, ${appointmentDate} ${startTime}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>New Appointment Booked</h2>
        <p>Hi Dr. ${doctorName},</p>
        <p>A new appointment has been booked via your Larinova booking page.</p>
        <h3 style="margin-top:20px;">Appointment Details</h3>
        <table style="border-collapse:collapse;width:100%;margin:8px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Date</td><td style="padding:6px;">${appointmentDate}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Time</td><td style="padding:6px;">${startTime}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Type</td><td style="padding:6px;">${appointmentType === "video" ? "Video Call" : "In-Person Visit"}</td></tr>
        </table>
        <h3 style="margin-top:20px;">Patient Information</h3>
        <table style="border-collapse:collapse;width:100%;margin:8px 0;">
          <tr><td style="padding:6px;color:#6b7280;">Name</td><td style="padding:6px;">${bookerName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Email</td><td style="padding:6px;">${bookerEmail}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Phone</td><td style="padding:6px;">${bookerPhone}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Age</td><td style="padding:6px;">${bookerAge}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Gender</td><td style="padding:6px;">${bookerGender}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Reason</td><td style="padding:6px;">${reason}</td></tr>
          <tr><td style="padding:6px;color:#6b7280;">Chief Complaint</td><td style="padding:6px;">${chiefComplaint}</td></tr>
        </table>
        <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Powered by Larinova</p>
      </div>
    `,
  });
}
```

Note: `Resend` is already imported at the top of the file. Do not add a duplicate import.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/resend/email.ts
git commit -m "feat: add appointment confirmation and doctor notification email templates"
```

---

### Task 6: Public Booking API — POST Create Appointment

**Files:**
- Create: `app/api/booking/[handle]/appointments/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAppointmentConfirmation,
  sendDoctorNewBookingNotification,
} from "@/lib/resend/email";
import { generateTimeSlots, filterAvailableSlots } from "@/lib/booking/slots";

const GENDER_VALUES = ["male", "female", "other", "prefer_not_to_say"] as const;
const TYPE_VALUES = ["video", "in_person"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    appointment_date,
    start_time,
    type,
    booker_name,
    booker_email,
    booker_phone,
    booker_age,
    booker_gender,
    reason,
    chief_complaint,
    notes,
  } = body as Record<string, string>;

  // Validate required fields
  if (
    !appointment_date || !start_time || !type || !booker_name ||
    !booker_email || !booker_phone || !booker_age || !booker_gender ||
    !reason || !chief_complaint
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!TYPE_VALUES.includes(type as typeof TYPE_VALUES[number])) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!GENDER_VALUES.includes(booker_gender as typeof GENDER_VALUES[number])) {
    return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, full_name, email, clinic_name, clinic_address, slot_duration_minutes, video_call_link, booking_enabled")
    .eq("booking_handle", handle)
    .single();

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }
  if (!doctor.booking_enabled) {
    return NextResponse.json({ error: "Doctor not accepting bookings" }, { status: 403 });
  }

  // Verify the slot is still available
  const dayOfWeek = new Date(appointment_date + "T00:00:00").getDay();
  const { data: avail } = await supabase
    .from("larinova_doctor_availability")
    .select("start_time, end_time, is_active, break_start, break_end")
    .eq("doctor_id", doctor.id)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!avail || !avail.is_active) {
    return NextResponse.json({ error: "No availability on this day" }, { status: 409 });
  }

  const slotDuration = doctor.slot_duration_minutes ?? 30;
  const allSlots = generateTimeSlots(
    avail.start_time.substring(0, 5),
    avail.end_time.substring(0, 5),
    slotDuration,
    avail.break_start,
    avail.break_end
  );
  if (!allSlots.includes(start_time)) {
    return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
  }

  const { data: booked } = await supabase
    .from("larinova_appointments")
    .select("start_time")
    .eq("doctor_id", doctor.id)
    .eq("appointment_date", appointment_date)
    .in("status", ["confirmed", "completed"]);

  const available = filterAvailableSlots(
    allSlots,
    (booked ?? []).map((b) => b.start_time)
  );
  if (!available.includes(start_time)) {
    return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
  }

  // Compute end_time
  const [sh, sm] = start_time.split(":").map(Number);
  const endMins = sh * 60 + sm + slotDuration;
  const end_time = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;

  const { data: appointment, error: insertError } = await supabase
    .from("larinova_appointments")
    .insert({
      doctor_id: doctor.id,
      appointment_date,
      start_time,
      end_time,
      type,
      booker_name,
      booker_email,
      booker_phone,
      booker_age: parseInt(booker_age),
      booker_gender,
      reason,
      chief_complaint,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError || !appointment) {
    console.error("[booking/appointments POST]", insertError);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }

  // Build Google Calendar URL
  const gcalDate = appointment_date.replace(/-/g, "");
  const gcalStart = `${gcalDate}T${start_time.replace(":", "")}00`;
  const gcalEnd = `${gcalDate}T${end_time.replace(":", "")}00`;
  const gcalTitle = encodeURIComponent(`Appointment with Dr. ${doctor.full_name}`);
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}`;

  // Format display date/time
  const displayDate = new Date(appointment_date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h, m] = start_time.split(":").map(Number);
  const displayTime = `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;

  // Send emails (fire and forget — appointment is already saved)
  Promise.all([
    sendAppointmentConfirmation({
      to: booker_email,
      bookerName: booker_name,
      doctorName: doctor.full_name,
      clinicName: doctor.clinic_name ?? "",
      clinicAddress: doctor.clinic_address,
      appointmentDate: displayDate,
      startTime: displayTime,
      appointmentType: type as "video" | "in_person",
      videoCallLink: doctor.video_call_link,
      googleCalendarUrl,
    }),
    sendDoctorNewBookingNotification({
      to: doctor.email,
      doctorName: doctor.full_name,
      bookerName: booker_name,
      bookerEmail: booker_email,
      bookerPhone: booker_phone,
      bookerAge: parseInt(booker_age),
      bookerGender: booker_gender,
      reason,
      chiefComplaint: chief_complaint,
      appointmentDate: displayDate,
      startTime: displayTime,
      appointmentType: type as "video" | "in_person",
    }),
  ]).catch((err) => console.error("[booking/appointments email]", err));

  return NextResponse.json({ appointment, googleCalendarUrl }, { status: 201 });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke test**

```bash
curl -X POST http://localhost:3000/api/booking/HANDLE_HERE/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_date": "2026-04-14",
    "start_time": "09:00",
    "type": "video",
    "booker_name": "Test Patient",
    "booker_email": "test@example.com",
    "booker_phone": "9876543210",
    "booker_age": "30",
    "booker_gender": "male",
    "reason": "Chest pain",
    "chief_complaint": "Mild chest discomfort for 2 days"
  }'
```
Expected: `{ "appointment": { "id": "...", ... }, "googleCalendarUrl": "https://calendar.google.com/..." }` with status 201.

- [ ] **Step 4: Commit**

```bash
git add app/api/booking/[handle]/appointments/
git commit -m "feat: add POST /api/booking/[handle]/appointments"
```

---

### Task 7: Calendar API — Appointments CRUD

**Files:**
- Create: `app/api/calendar/appointments/route.ts`
- Create: `app/api/calendar/appointments/[id]/route.ts`

- [ ] **Step 1: Create `app/api/calendar/appointments/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const from = req.nextUrl.searchParams.get("from"); // YYYY-MM-DD
  const to = req.nextUrl.searchParams.get("to");     // YYYY-MM-DD

  let query = supabase
    .from("larinova_appointments")
    .select("*")
    .eq("doctor_id", doctor.id)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (from) query = query.gte("appointment_date", from);
  if (to) query = query.lte("appointment_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ appointments: data });
}
```

- [ ] **Step 2: Create `app/api/calendar/appointments/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const body = await req.json() as { status: string };
  const allowed = ["confirmed", "cancelled", "completed"];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("larinova_appointments")
    .update({ status: body.status })
    .eq("id", id)
    .eq("doctor_id", doctor.id) // ensures doctor can only update their own
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointment: data });
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/api/calendar/appointments/
git commit -m "feat: add calendar appointments GET and PATCH endpoints"
```

---

### Task 8: Calendar API — Availability + Handle

**Files:**
- Create: `app/api/calendar/availability/route.ts`
- Create: `app/api/calendar/handle/route.ts`

- [ ] **Step 1: Create `app/api/calendar/availability/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHandle, handleWithSuffix } from "@/lib/booking/handle";

// GET: return doctor's availability + current handle/settings
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id, full_name, booking_handle, booking_enabled, slot_duration_minutes, video_call_link, region")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  // Auto-generate handle if missing
  if (!doctor.booking_handle) {
    const admin = createAdminClient();
    let handle = generateHandle(doctor.full_name);
    const { data: existing } = await admin
      .from("larinova_doctors")
      .select("id")
      .eq("booking_handle", handle)
      .neq("id", doctor.id)
      .maybeSingle();
    if (existing) handle = handleWithSuffix(handle);

    await admin
      .from("larinova_doctors")
      .update({ booking_handle: handle })
      .eq("id", doctor.id);
    doctor.booking_handle = handle;
  }

  const { data: availability } = await supabase
    .from("larinova_doctor_availability")
    .select("*")
    .eq("doctor_id", doctor.id)
    .order("day_of_week");

  // Seed default Mon-Fri 9-5 if no rows
  if (!availability || availability.length === 0) {
    const admin = createAdminClient();
    const defaults = [1, 2, 3, 4, 5].map((day) => ({
      doctor_id: doctor.id,
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      is_active: true,
    }));
    await admin.from("larinova_doctor_availability").insert(defaults);
    const { data: seeded } = await supabase
      .from("larinova_doctor_availability")
      .select("*")
      .eq("doctor_id", doctor.id)
      .order("day_of_week");
    return NextResponse.json({ doctor, availability: seeded ?? [] });
  }

  return NextResponse.json({ doctor, availability });
}

// PUT: save weekly availability rows
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const body = await req.json() as {
    availability: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
      break_start?: string | null;
      break_end?: string | null;
    }>;
    slot_duration_minutes?: number;
    video_call_link?: string;
    booking_enabled?: boolean;
  };

  const admin = createAdminClient();

  // Upsert availability rows
  const rows = body.availability.map((a) => ({
    doctor_id: doctor.id,
    day_of_week: a.day_of_week,
    start_time: a.start_time,
    end_time: a.end_time,
    is_active: a.is_active,
    break_start: a.break_start ?? null,
    break_end: a.break_end ?? null,
  }));

  const { error: availError } = await admin
    .from("larinova_doctor_availability")
    .upsert(rows, { onConflict: "doctor_id,day_of_week" });

  if (availError) return NextResponse.json({ error: availError.message }, { status: 500 });

  // Update doctor settings
  const updates: Record<string, unknown> = {};
  if (body.slot_duration_minutes !== undefined) updates.slot_duration_minutes = body.slot_duration_minutes;
  if (body.video_call_link !== undefined) updates.video_call_link = body.video_call_link;
  if (body.booking_enabled !== undefined) updates.booking_enabled = body.booking_enabled;

  if (Object.keys(updates).length > 0) {
    await admin.from("larinova_doctors").update(updates).eq("id", doctor.id);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create `app/api/calendar/handle/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const { handle } = await req.json() as { handle: string };
  if (!handle || !/^[a-z0-9-]{3,40}$/.test(handle)) {
    return NextResponse.json({ error: "Invalid handle. Use 3–40 lowercase letters, numbers, or hyphens." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("booking_handle", handle)
    .neq("id", doctor.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Handle already taken", available: false }, { status: 409 });
  }

  await admin.from("larinova_doctors").update({ booking_handle: handle }).eq("id", doctor.id);
  return NextResponse.json({ success: true, handle, available: true });
}

// GET: check if a handle is available (used for live validation on blur)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle || !/^[a-z0-9-]{3,40}$/.test(handle)) {
    return NextResponse.json({ available: false, error: "Invalid handle format" });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("larinova_doctors")
    .select("id")
    .eq("booking_handle", handle)
    .neq("id", doctor.id)
    .maybeSingle();

  return NextResponse.json({ available: !existing });
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/api/calendar/
git commit -m "feat: add calendar availability and handle API endpoints"
```

---

### Task 9: DoctorCard Component (Booking Page Left Panel)

**Files:**
- Create: `components/booking/DoctorCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import Image from "next/image";

export type AppointmentType = "video" | "in_person";

interface DoctorInfo {
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
  profile_image_url: string | null;
  id: string;
  slot_duration_minutes: number;
  booking_enabled: boolean;
}

interface DoctorCardProps {
  doctor: DoctorInfo;
  selectedType: AppointmentType;
  onTypeChange: (type: AppointmentType) => void;
  detectedTimezone: string;
  locale: "en" | "id";
}

const T = {
  en: {
    video: "Video Call",
    inPerson: "In-Person Visit",
    min: (n: number) => `${n} min`,
    timezone: "Timezone",
    notAccepting: "This doctor is not currently accepting bookings.",
  },
  id: {
    video: "Video Call",
    inPerson: "Kunjungan Langsung",
    min: (n: number) => `${n} menit`,
    timezone: "Zona waktu",
    notAccepting: "Dokter ini sedang tidak menerima booking.",
  },
};

export function DoctorCard({
  doctor,
  selectedType,
  onTypeChange,
  detectedTimezone,
  locale,
}: DoctorCardProps) {
  const t = T[locale];
  const avatarUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${doctor.id}`;
  const duration = doctor.slot_duration_minutes ?? 30;

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {doctor.profile_image_url ? (
            <Image
              src={doctor.profile_image_url}
              alt={doctor.full_name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <img src={avatarUrl} alt={doctor.full_name} className="w-full h-full" />
          )}
        </div>
        <div>
          <div className="font-semibold text-foreground">{doctor.full_name}</div>
          {doctor.specialization && (
            <div className="text-sm text-muted-foreground">{doctor.specialization}</div>
          )}
          {doctor.clinic_name && (
            <div className="text-xs text-muted-foreground">{doctor.clinic_name}</div>
          )}
        </div>
      </div>

      {!doctor.booking_enabled ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-3">
          {t.notAccepting}
        </p>
      ) : (
        <>
          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <TypeCard
              icon="📹"
              label={t.video}
              duration={t.min(duration)}
              selected={selectedType === "video"}
              onClick={() => onTypeChange("video")}
            />
            <TypeCard
              icon="🏥"
              label={t.inPerson}
              duration={t.min(duration)}
              selected={selectedType === "in_person"}
              onClick={() => onTypeChange("in_person")}
            />
          </div>

          {/* Timezone */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{t.timezone}:</span> {detectedTimezone}
          </div>
        </>
      )}
    </div>
  );
}

function TypeCard({
  icon,
  label,
  duration,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  duration: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div>
        <div className={`text-sm font-medium ${selected ? "text-primary" : "text-foreground"}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{duration}</div>
      </div>
      {selected && (
        <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/booking/DoctorCard.tsx
git commit -m "feat: add DoctorCard component for booking page left panel"
```

---

### Task 10: SlotPicker Component

**Files:**
- Create: `components/booking/SlotPicker.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlotPickerProps {
  handle: string;
  onSlotSelected: (date: string, time: string) => void;
  locale: "en" | "id";
}

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SlotPicker({ handle, onSlotSelected, locale }: SlotPickerProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const days = locale === "id" ? DAYS_ID : DAYS_EN;
  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`/api/booking/${handle}/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, handle]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toYMD(new Date());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const d = toYMD(new Date(year, month, day));
    if (d < today) return;
    setSelectedDate(d);
    setSlots([]);
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    if (selectedDate) onSlotSelected(selectedDate, slot);
  };

  const noSlotMsg = locale === "id"
    ? "Tidak ada slot tersedia pada tanggal ini"
    : "No available slots on this date";

  return (
    <div className="flex flex-col gap-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">
          {months[month]} {year}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const ymd = toYMD(new Date(year, month, day));
          const isPast = ymd < today;
          const isSelected = ymd === selectedDate;
          return (
            <button
              key={ymd}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(day)}
              className={`text-center text-sm py-1.5 rounded-lg transition-colors
                ${isPast ? "text-muted-foreground/40 cursor-not-allowed" : "hover:bg-accent cursor-pointer"}
                ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Slot grid */}
      {selectedDate && (
        <div className="mt-2">
          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{noSlotMsg}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotClick(slot)}
                  className={`text-sm py-2 rounded-lg border transition-colors
                    ${selectedSlot === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary hover:text-primary"
                    }
                  `}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/booking/SlotPicker.tsx
git commit -m "feat: add SlotPicker component for booking page"
```

---

### Task 11: BookingForm Component

**Files:**
- Create: `components/booking/BookingForm.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { ArrowLeft, Lock, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentType } from "./DoctorCard";

interface BookingFormProps {
  handle: string;
  selectedDate: string;      // YYYY-MM-DD
  selectedTime: string;      // "09:00"
  appointmentType: AppointmentType;
  doctorName: string;
  slotDurationMinutes: number;
  onBack: () => void;
  locale: "en" | "id";
}

interface ConfirmationData {
  bookerEmail: string;
  bookerName: string;
  appointmentDate: string;
  startTime: string;
  appointmentType: AppointmentType;
  doctorName: string;
  googleCalendarUrl: string;
}

const L = {
  en: {
    title: "Your details",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    age: "Age",
    gender: "Gender",
    genderOptions: { male: "Male", female: "Female", other: "Other", prefer_not_to_say: "Prefer not to say" },
    reason: "Reason for visit",
    chiefComplaint: "Chief complaint",
    chiefComplaintPlaceholder: "Describe your main symptoms or concern",
    notes: "Additional notes (optional)",
    paymentTitle: "Consultation Fee Payment",
    paymentComingSoon: "Coming Soon",
    confirm: "Confirm Appointment",
    confirming: "Confirming...",
    confirmed: "Appointment Confirmed!",
    confirmedSubtitle: (email: string) => `A confirmation has been sent to ${email}`,
    addToCalendar: "Add to Google Calendar",
    video: "Video Call",
    inPerson: "In-Person Visit",
  },
  id: {
    title: "Data diri",
    fullName: "Nama Lengkap",
    email: "Email",
    phone: "Telepon",
    age: "Usia",
    gender: "Jenis kelamin",
    genderOptions: { male: "Laki-laki", female: "Perempuan", other: "Lainnya", prefer_not_to_say: "Tidak ingin menyebutkan" },
    reason: "Alasan kunjungan",
    chiefComplaint: "Keluhan utama",
    chiefComplaintPlaceholder: "Jelaskan gejala atau keluhan utama Anda",
    notes: "Catatan tambahan (opsional)",
    paymentTitle: "Pembayaran Biaya Konsultasi",
    paymentComingSoon: "Segera Hadir",
    confirm: "Konfirmasi Janji",
    confirming: "Mengkonfirmasi...",
    confirmed: "Janji Dikonfirmasi!",
    confirmedSubtitle: (email: string) => `Konfirmasi telah dikirim ke ${email}`,
    addToCalendar: "Tambah ke Google Calendar",
    video: "Video Call",
    inPerson: "Kunjungan Langsung",
  },
};

function formatDisplayDate(ymd: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric",
  });
}
function formatDisplayTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function BookingForm({
  handle,
  selectedDate,
  selectedTime,
  appointmentType,
  doctorName,
  slotDurationMinutes,
  onBack,
  locale,
}: BookingFormProps) {
  const t = L[locale];
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    booker_name: "",
    booker_email: "",
    booker_phone: "",
    booker_age: "",
    booker_gender: "",
    reason: "",
    chief_complaint: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/booking/${handle}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: selectedDate,
          start_time: selectedTime,
          type: appointmentType,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setConfirmation({
        bookerEmail: form.booker_email,
        bookerName: form.booker_name,
        appointmentDate: formatDisplayDate(selectedDate),
        startTime: formatDisplayTime(selectedTime),
        appointmentType,
        doctorName,
        googleCalendarUrl: data.googleCalendarUrl,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation screen
  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.confirmed}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.confirmedSubtitle(confirmation.bookerEmail)}
          </p>
        </div>
        <div className="w-full bg-muted rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doctor</span>
            <span className="font-medium">{confirmation.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{confirmation.appointmentDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{confirmation.startTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>{confirmation.appointmentType === "video" ? t.video : t.inPerson}</span>
          </div>
        </div>
        <a
          href={confirmation.googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Calendar className="w-4 h-4" />
          {t.addToCalendar}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Back + summary */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2 text-xs">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {formatDisplayDate(selectedDate)} · {formatDisplayTime(selectedTime)}
          </span>
          <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {appointmentType === "video" ? t.video : t.inPerson} · {slotDurationMinutes} min
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-foreground">{t.title}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">{t.fullName} *</Label>
          <Input required value={form.booker_name} onChange={(e) => setForm({ ...form, booker_name: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.email} *</Label>
          <Input required type="email" value={form.booker_email} onChange={(e) => setForm({ ...form, booker_email: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">{t.phone} *</Label>
          <Input required value={form.booker_phone} onChange={(e) => setForm({ ...form, booker_phone: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">{t.age} *</Label>
          <Input required type="text" inputMode="numeric" value={form.booker_age}
            onChange={(e) => setForm({ ...form, booker_age: e.target.value.replace(/[^0-9]/g, "") })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.gender} *</Label>
          <Select required value={form.booker_gender} onValueChange={(v) => setForm({ ...form, booker_gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(t.genderOptions).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.reason} *</Label>
          <Input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.chiefComplaint} *</Label>
          <Textarea required rows={3} placeholder={t.chiefComplaintPlaceholder}
            value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">{t.notes}</Label>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>

      {/* Payment stub — disabled */}
      <div className="border border-border rounded-xl p-4 opacity-50 select-none pointer-events-none">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="font-medium">{t.paymentTitle}</span>
          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{t.paymentComingSoon}</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t.confirming : t.confirm}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/booking/BookingForm.tsx
git commit -m "feat: add BookingForm component with confirmation screen"
```

---

### Task 12: Public Booking Page Shell

**Files:**
- Create: `app/book/[handle]/page.tsx`
- Create: `app/book/[handle]/BookingClient.tsx`

- [ ] **Step 1: Create `app/book/[handle]/page.tsx`**

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingClient } from "./BookingClient";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/${handle}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { title: "Book an Appointment | Larinova" };
    const { doctor } = await res.json();
    return { title: `Book with ${doctor.full_name} | Larinova` };
  } catch {
    return { title: "Book an Appointment | Larinova" };
  }
}

export default async function BookingPage({ params }: Props) {
  const { handle } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/booking/${handle}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) notFound();
  const { doctor, availability } = await res.json();
  return <BookingClient handle={handle} doctor={doctor} availability={availability} />;
}
```

- [ ] **Step 2: Create `app/book/[handle]/BookingClient.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { DoctorCard, type AppointmentType } from "@/components/booking/DoctorCard";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { BookingForm } from "@/components/booking/BookingForm";
import { detectRegionFromTimezone } from "@/lib/booking/slots";

type Locale = "en" | "id";

interface AvailabilityRow {
  day_of_week: number;
  is_active: boolean;
}
interface DoctorInfo {
  id: string;
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  profile_image_url: string | null;
  booking_enabled: boolean;
  slot_duration_minutes: number;
  video_call_link: string | null;
  region: "IN" | "ID";
}

interface Props {
  handle: string;
  doctor: DoctorInfo;
  availability: AvailabilityRow[];
}

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.startsWith("id") ? "id" : "en";
}

export function BookingClient({ handle, doctor, availability }: Props) {
  const [locale, setLocale] = useState<Locale>("en");
  const [timezone, setTimezone] = useState("UTC");
  const [visitorRegion, setVisitorRegion] = useState<"IN" | "ID" | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("video");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    setLocale(detectLocale());
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    setVisitorRegion(detectRegionFromTimezone(tz));
  }, []);

  const handleSlotSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowForm(true);
  };

  const showCrossRegionWarning =
    !warningDismissed &&
    visitorRegion !== null &&
    visitorRegion !== doctor.region &&
    appointmentType === "in_person";

  const warningText =
    locale === "id"
      ? doctor.region === "ID"
        ? "Catatan: Dokter ini berpraktik di Indonesia. Kunjungan langsung memerlukan perjalanan ke Indonesia."
        : "Catatan: Dokter ini berpraktik di India. Kunjungan langsung memerlukan perjalanan ke India."
      : doctor.region === "ID"
        ? "Note: This doctor is based in Indonesia. In-person visits require travel to Indonesia."
        : "Note: This doctor is based in India. In-person visits require travel to India.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cross-region warning */}
      {showCrossRegionWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-700 text-sm flex-1">{warningText}</span>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-amber-500 hover:text-amber-700 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 gap-6">
        {/* Left panel */}
        <div className="w-full md:w-80 shrink-0">
          <DoctorCard
            doctor={doctor}
            selectedType={appointmentType}
            onTypeChange={(t) => { setAppointmentType(t); setShowForm(false); setSelectedDate(null); setSelectedTime(null); }}
            detectedTimezone={timezone}
            locale={locale}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border" />

        {/* Right panel */}
        {doctor.booking_enabled && (
          <div className="flex-1 min-w-0">
            {showForm && selectedDate && selectedTime ? (
              <BookingForm
                handle={handle}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                appointmentType={appointmentType}
                doctorName={doctor.full_name}
                slotDurationMinutes={doctor.slot_duration_minutes ?? 30}
                onBack={() => setShowForm(false)}
                locale={locale}
              />
            ) : (
              <SlotPicker
                handle={handle}
                onSlotSelected={handleSlotSelected}
                locale={locale}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        Powered by{" "}
        <a href="https://larinova.com" className="hover:underline text-foreground">
          Larinova
        </a>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Visual test in browser**

Navigate to `http://localhost:3000/book/HANDLE` (use a real doctor's handle from Supabase).

Verify:
- Left panel shows doctor info + type cards
- Right panel shows month calendar
- Clicking a date loads slots
- Selecting a slot slides in the form
- Back button returns to slot view
- Form submits and shows confirmation screen

- [ ] **Step 5: Commit**

```bash
git add app/book/
git commit -m "feat: add public booking page /book/[handle]"
```

---

### Task 13: AppointmentEvent + CalendarTab

**Files:**
- Create: `components/calendar/AppointmentEvent.tsx`
- Create: `components/calendar/CalendarTab.tsx`

- [ ] **Step 1: Create `components/calendar/AppointmentEvent.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Video, Building2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "video" | "in_person";
  status: "confirmed" | "cancelled" | "completed";
  booker_name: string;
  booker_email: string;
  booker_phone: string;
  booker_age: number;
  booker_gender: string;
  reason: string;
  chief_complaint: string;
  notes: string | null;
}

interface AppointmentEventProps {
  appointment: Appointment;
  compact?: boolean;
  onStatusChange: (id: string, status: "completed" | "cancelled") => void;
}

export function AppointmentEvent({ appointment, compact, onStatusChange }: AppointmentEventProps) {
  const [open, setOpen] = useState(false);
  const isVideo = appointment.type === "video";
  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";

  const bg = isCancelled
    ? "bg-muted/50 border-muted text-muted-foreground"
    : isVideo
      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`w-full text-left rounded border px-2 py-1 text-xs font-medium truncate transition-opacity ${bg} ${isCancelled ? "line-through opacity-60" : ""}`}
        >
          {isVideo ? <Video className="inline w-3 h-3 mr-1" /> : <Building2 className="inline w-3 h-3 mr-1" />}
          {compact ? appointment.start_time : `${appointment.start_time} ${appointment.booker_name}`}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="right">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isVideo ? <Video className="w-4 h-4 text-indigo-500" /> : <Building2 className="w-4 h-4 text-cyan-500" />}
            <span className="font-semibold text-sm">{appointment.booker_name}</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              appointment.status === "confirmed" ? "bg-green-100 text-green-700" :
              appointment.status === "completed" ? "bg-muted text-muted-foreground" :
              "bg-red-100 text-red-700"
            }`}>{appointment.status}</span>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div><span className="font-medium text-foreground">Time:</span> {appointment.start_time} – {appointment.end_time}</div>
            <div><span className="font-medium text-foreground">Email:</span> {appointment.booker_email}</div>
            <div><span className="font-medium text-foreground">Phone:</span> {appointment.booker_phone}</div>
            <div><span className="font-medium text-foreground">Age:</span> {appointment.booker_age} · {appointment.booker_gender}</div>
            <div><span className="font-medium text-foreground">Reason:</span> {appointment.reason}</div>
            <div><span className="font-medium text-foreground">Chief complaint:</span> {appointment.chief_complaint}</div>
            {appointment.notes && <div><span className="font-medium text-foreground">Notes:</span> {appointment.notes}</div>}
          </div>
          {appointment.status === "confirmed" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs"
                onClick={() => { onStatusChange(appointment.id, "completed"); setOpen(false); }}>
                <CheckCircle className="w-3 h-3" /> Mark Complete
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={() => { onStatusChange(appointment.id, "cancelled"); setOpen(false); }}>
                <X className="w-3 h-3" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Create `components/calendar/CalendarTab.tsx`**

This component implements month/week/day views. Keep it under 300 lines by using focused sub-renders.

```typescript
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentEvent, type Appointment } from "./AppointmentEvent";

type View = "month" | "week" | "day";

interface CalendarTabProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: "completed" | "cancelled") => void;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getWeekDates(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function CalendarTab({ appointments, onStatusChange }: CalendarTabProps) {
  const [view, setView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    (acc[a.appointment_date] ??= []).push(a);
    return acc;
  }, {});

  const nav = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const today = toYMD(new Date());

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => nav(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold text-sm min-w-[140px] text-center">
            {view === "month"
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : view === "week"
                ? `Week of ${getWeekDates(currentDate)[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => nav(1)}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">Today</Button>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${view === v ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month view */}
      {view === "month" && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          {(() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
            while (cells.length % 7 !== 0) cells.push(null);
            const rows: (number | null)[][] = [];
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
            return rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 border-b border-border last:border-0">
                {row.map((day, ci) => {
                  if (!day) return <div key={ci} className="min-h-[80px] border-r border-border last:border-0 bg-muted/20" />;
                  const ymd = toYMD(new Date(year, month, day));
                  const dayAppts = byDate[ymd] ?? [];
                  const isToday = ymd === today;
                  return (
                    <div key={ci} className="min-h-[80px] border-r border-border last:border-0 p-1">
                      <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((a) => (
                          <AppointmentEvent key={a.id} appointment={a} compact onStatusChange={onStatusChange} />
                        ))}
                        {dayAppts.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">+{dayAppts.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Week view */}
      {view === "week" && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {getWeekDates(currentDate).map((d) => {
              const ymd = toYMD(d);
              const dayAppts = byDate[ymd] ?? [];
              const isToday = ymd === today;
              return (
                <div key={ymd} className="border-r border-border last:border-0 min-h-[200px]">
                  <div className={`py-2 text-center text-xs border-b border-border ${isToday ? "bg-primary/5" : ""}`}>
                    <div className="text-muted-foreground">{DAYS_SHORT[d.getDay()]}</div>
                    <div className={`font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</div>
                  </div>
                  <div className="p-1 space-y-1">
                    {dayAppts.map((a) => (
                      <AppointmentEvent key={a.id} appointment={a} onStatusChange={onStatusChange} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === "day" && (
        <div className="border border-border rounded-xl p-4">
          <div className="space-y-2">
            {(byDate[toYMD(currentDate)] ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No appointments on this day.</p>
            ) : (
              (byDate[toYMD(currentDate)] ?? []).map((a) => (
                <AppointmentEvent key={a.id} appointment={a} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {appointments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No appointments yet. Share your booking link to get started.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/calendar/AppointmentEvent.tsx components/calendar/CalendarTab.tsx
git commit -m "feat: add AppointmentEvent and CalendarTab components"
```

---

### Task 14: AvailabilityTab Component

**Files:**
- Create: `components/calendar/AvailabilityTab.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start: string | null;
  break_end: string | null;
}

interface AvailabilityTabProps {
  initialAvailability: AvailabilityRow[];
  initialSlotDuration: number;
  initialVideoCallLink: string | null;
  initialBookingEnabled: boolean;
}

const DEFAULT_DAYS: AvailabilityRow[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  day_of_week: d,
  start_time: "09:00",
  end_time: "17:00",
  is_active: d >= 1 && d <= 5,
  break_start: null,
  break_end: null,
}));

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityTab({
  initialAvailability,
  initialSlotDuration,
  initialVideoCallLink,
  initialBookingEnabled,
}: AvailabilityTabProps) {
  const t = useTranslations("calendar.availability");

  // Merge defaults with loaded data
  const merged = DEFAULT_DAYS.map((def) => {
    const loaded = initialAvailability.find((a) => a.day_of_week === def.day_of_week);
    return loaded ?? def;
  });

  const [rows, setRows] = useState<AvailabilityRow[]>(merged);
  const [slotDuration, setSlotDuration] = useState(initialSlotDuration ?? 30);
  const [videoCallLink, setVideoCallLink] = useState(initialVideoCallLink ?? "");
  const [bookingEnabled, setBookingEnabled] = useState(initialBookingEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const updateRow = (dayOfWeek: number, patch: Partial<AvailabilityRow>) => {
    setRows((prev) => prev.map((r) => r.day_of_week === dayOfWeek ? { ...r, ...patch } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: rows,
          slot_duration_minutes: slotDuration,
          video_call_link: videoCallLink || null,
          booking_enabled: bookingEnabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("saved"));
    } catch {
      toast.error("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Slot duration */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium min-w-[120px]">{t("slotDuration")}</Label>
        <Select value={String(slotDuration)} onValueChange={(v) => setSlotDuration(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[15, 30, 45, 60].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} min</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accept bookings toggle */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium min-w-[120px]">Accept bookings</Label>
        <Switch checked={bookingEnabled} onCheckedChange={setBookingEnabled} />
      </div>

      {/* Day rows */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {rows.map((row) => (
          <div key={row.day_of_week} className={`flex flex-col gap-2 p-3 ${!row.is_active ? "bg-muted/30" : ""}`}>
            <div className="flex items-center gap-3">
              <Switch
                checked={row.is_active}
                onCheckedChange={(v) => updateRow(row.day_of_week, { is_active: v })}
              />
              <span className={`text-sm font-medium min-w-[80px] ${!row.is_active ? "text-muted-foreground" : "text-foreground"}`}>
                {DAY_NAMES[row.day_of_week]}
              </span>
              {row.is_active && (
                <>
                  <Input
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.day_of_week, { start_time: e.target.value })}
                    className="w-28 text-xs"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.day_of_week, { end_time: e.target.value })}
                    className="w-28 text-xs"
                  />
                </>
              )}
            </div>
            {row.is_active && (
              <div className="pl-12 flex items-center gap-2">
                {row.break_start ? (
                  <>
                    <span className="text-xs text-muted-foreground">{t("breakTime")}:</span>
                    <Input type="time" value={row.break_start ?? ""} onChange={(e) => updateRow(row.day_of_week, { break_start: e.target.value })} className="w-24 text-xs" />
                    <span className="text-muted-foreground text-xs">–</span>
                    <Input type="time" value={row.break_end ?? ""} onChange={(e) => updateRow(row.day_of_week, { break_end: e.target.value })} className="w-24 text-xs" />
                    <button onClick={() => updateRow(row.day_of_week, { break_start: null, break_end: null })} className="text-xs text-muted-foreground hover:text-destructive">{t("removeBreak")}</button>
                  </>
                ) : (
                  <button onClick={() => updateRow(row.day_of_week, { break_start: "13:00", break_end: "14:00" })} className="text-xs text-muted-foreground hover:text-foreground">
                    + {t("addBreak")}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video call link */}
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">Video call link</Label>
        <Input
          value={videoCallLink}
          onChange={(e) => setVideoCallLink(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="max-w-sm"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Saving..." : t("saveChanges")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/calendar/AvailabilityTab.tsx
git commit -m "feat: add AvailabilityTab component"
```

---

### Task 15: BookingPageTab + AnalyticsTab

**Files:**
- Create: `components/calendar/BookingPageTab.tsx`
- Create: `components/calendar/AnalyticsTab.tsx`

- [ ] **Step 1: Create `components/calendar/BookingPageTab.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BookingPageTabProps {
  initialHandle: string;
  appUrl: string;
}

export function BookingPageTab({ initialHandle, appUrl }: BookingPageTabProps) {
  const t = useTranslations("calendar.bookingPage");
  const [handle, setHandle] = useState(initialHandle);
  const [editHandle, setEditHandle] = useState(initialHandle);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bookingUrl = `${appUrl}/book/${handle}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onHandleChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setEditHandle(clean);
    setHandleStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (clean === handle || clean.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setHandleStatus("checking");
      const res = await fetch(`/api/calendar/handle?handle=${clean}`);
      const data = await res.json();
      setHandleStatus(data.available ? "available" : "taken");
    }, 500);
  };

  const saveHandle = async () => {
    if (handleStatus !== "available" && editHandle !== handle) return;
    setSaving(true);
    try {
      const res = await fetch("/api/calendar/handle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: editHandle }),
      });
      if (!res.ok) { toast.error("Failed to save handle"); return; }
      setHandle(editHandle);
      setHandleStatus("idle");
      toast.success("Booking handle updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex gap-6">
        {/* Left controls */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <div>
            <Label className="text-sm font-medium">{t("yourLink")}</Label>
            <div className="flex gap-2 mt-1">
              <Input value={bookingUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">{t("handle")}</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  value={editHandle}
                  onChange={(e) => onHandleChange(e.target.value)}
                  className="text-xs"
                  placeholder="dr-your-name"
                />
                {handleStatus !== "idle" && (
                  <div className={`text-xs mt-1 ${handleStatus === "available" ? "text-green-600" : handleStatus === "taken" ? "text-destructive" : "text-muted-foreground"}`}>
                    {handleStatus === "checking" ? "Checking..." :
                     handleStatus === "available" ? t("handleAvailable") :
                     t("handleTaken")}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                disabled={saving || (handleStatus !== "available" && editHandle !== handle)}
                onClick={saveHandle}
              >
                {saving ? "..." : t("saveHandle")}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: iframe preview */}
        <div className="flex-1 border border-border rounded-xl overflow-hidden" style={{ height: 500 }}>
          <iframe
            src={bookingUrl}
            className="w-full h-full"
            title="Booking page preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/calendar/AnalyticsTab.tsx`**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Appointment } from "./AppointmentEvent";

interface AnalyticsTabProps {
  appointments: Appointment[];
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const m = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return m;
}

export function AnalyticsTab({ appointments: allAppts }: AnalyticsTabProps) {
  const t = useTranslations("calendar.analytics");
  const now = new Date();

  const confirmed = allAppts.filter((a) => a.status !== "cancelled");
  const thisMonth = confirmed.filter((a) => {
    const d = new Date(a.appointment_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const completed = allAppts.filter((a) => a.status === "completed");
  const completionRate = confirmed.length > 0
    ? Math.round((completed.length / confirmed.length) * 100)
    : 0;
  const videoCount = confirmed.filter((a) => a.type === "video").length;
  const inPersonCount = confirmed.filter((a) => a.type === "in_person").length;

  // Weekly data (last 8 weeks)
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 7 * (7 - i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const wsYmd = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    const weYmd = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`;
    const count = confirmed.filter((a) => a.appointment_date >= wsYmd && a.appointment_date <= weYmd).length;
    return { week: getWeekLabel(wsYmd), count };
  });

  const upcoming = allAppts
    .filter((a) => a.appointment_date >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}` && a.status === "confirmed")
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("totalBookings")} value={confirmed.length} />
        <StatCard label={t("thisMonth")} value={thisMonth.length} />
        <StatCard label={t("completionRate")} value={`${completionRate}%`} />
        <StatCard label={t("videoVsInPerson")} value={`${videoCount}v / ${inPersonCount}p`} />
      </div>

      {/* Bar chart */}
      <div className="border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">{t("weeklyBookings")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t("upcomingAppointments")}</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noUpcoming")}</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 text-sm">
                <span className="text-lg">{a.type === "video" ? "📹" : "🏥"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.booker_name}</div>
                  <div className="text-xs text-muted-foreground">{a.appointment_date} · {a.start_time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
```

- [ ] **Step 3: Install recharts if needed**

```bash
npm list recharts 2>/dev/null | grep recharts || npm install recharts
```

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/calendar/BookingPageTab.tsx components/calendar/AnalyticsTab.tsx
git commit -m "feat: add BookingPageTab and AnalyticsTab components"
```

---

### Task 16: CalendarPage Orchestrator + Protected Route

**Files:**
- Create: `components/calendar/CalendarPage.tsx`
- Create: `app/[locale]/(protected)/calendar/page.tsx`

- [ ] **Step 1: Create `components/calendar/CalendarPage.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarTab } from "./CalendarTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { BookingPageTab } from "./BookingPageTab";
import { AnalyticsTab } from "./AnalyticsTab";
import type { Appointment } from "./AppointmentEvent";

type Tab = "calendar" | "availability" | "bookingPage" | "analytics";

interface DoctorSettings {
  booking_handle: string;
  booking_enabled: boolean;
  slot_duration_minutes: number;
  video_call_link: string | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start: string | null;
  break_end: string | null;
}

interface CalendarPageProps {
  appUrl: string;
}

export function CalendarPage({ appUrl }: CalendarPageProps) {
  const t = useTranslations("calendar");
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, availRes] = await Promise.all([
        fetch("/api/calendar/appointments"),
        fetch("/api/calendar/availability"),
      ]);
      const apptData = await apptRes.json();
      const availData = await availRes.json();
      setAppointments(apptData.appointments ?? []);
      setSettings(availData.doctor ?? null);
      setAvailability(availData.availability ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id: string, status: "completed" | "cancelled") => {
    const res = await fetch(`/api/calendar/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    }
  };

  const bookingUrl = settings ? `${appUrl}/book/${settings.booking_handle}` : "";

  const handleCopy = async () => {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "calendar", label: t("tabs.calendar") },
    { id: "availability", label: t("tabs.availability") },
    { id: "bookingPage", label: t("tabs.bookingPage") },
    { id: "analytics", label: t("tabs.analytics") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        {settings?.booking_handle && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 text-xs">
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <ExternalLink className="w-3 h-3" />
                View booking page
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "calendar" && (
        <CalendarTab appointments={appointments} onStatusChange={handleStatusChange} />
      )}
      {activeTab === "availability" && settings && (
        <AvailabilityTab
          initialAvailability={availability}
          initialSlotDuration={settings.slot_duration_minutes ?? 30}
          initialVideoCallLink={settings.video_call_link}
          initialBookingEnabled={settings.booking_enabled}
        />
      )}
      {activeTab === "bookingPage" && settings && (
        <BookingPageTab initialHandle={settings.booking_handle} appUrl={appUrl} />
      )}
      {activeTab === "analytics" && (
        <AnalyticsTab appointments={appointments} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/(protected)/calendar/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarPage } from "@/components/calendar/CalendarPage";

export default async function CalendarRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: doctor } = await supabase
    .from("larinova_doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) redirect("/sign-in");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <CalendarPage appUrl={appUrl} />;
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Visual test in browser**

Navigate to `http://localhost:3000/in/calendar` (log in first).

Verify:
- Calendar tab loads with month/week/day switcher
- Availability tab shows 7 day rows with toggles
- Booking Page tab shows handle editor + iframe preview
- Analytics tab shows stat cards + chart
- Top bar "Copy link" and "View booking page" buttons work

- [ ] **Step 5: Commit**

```bash
git add components/calendar/CalendarPage.tsx app/\[locale\]/\(protected\)/calendar/
git commit -m "feat: add CalendarPage orchestrator and authenticated calendar route"
```

---

### Task 17: Final Integration Check

**Files:** No new files — integration and smoke testing.

- [ ] **Step 1: Full typecheck**

```bash
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Test end-to-end booking flow via browser**

1. Log in to the app at `http://localhost:3000`
2. Navigate to Calendar via sidebar — verify Calendar nav item appears
3. Go to Availability tab — save Mon-Fri 9am-5pm (verify saves without error)
4. Go to Booking Page tab — copy the booking link
5. Open the booking link in a new incognito window
6. Select "Video Call", pick a date, pick a slot, fill in the form, submit
7. Verify: confirmation screen shown with checkmark
8. Back in the doctor view → Calendar tab → verify the booked appointment appears
9. Click the appointment → verify popover shows all booker details
10. Click "Mark Complete" → verify status changes to completed

- [ ] **Step 3: Test cross-region warning**

In `BookingClient.tsx`, temporarily set `visitorRegion` to `"ID"` and `doctor.region` to `"IN"` — verify the amber warning banner appears when In-Person is selected. Revert the change.

- [ ] **Step 4: Test 404 for unknown handle**

```bash
curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/book/this-handle-does-not-exist-abc123
```
Expected: Next.js renders a 404 page (the `notFound()` call in `page.tsx`).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: calendar & booking feature complete — public /book/[handle] + doctor calendar page"
```

---

## Summary

| Task | What it builds | Est. complexity |
|------|---------------|-----------------|
| 1 | DB migration (2 tables + 5 cols) | Low |
| 2 | Middleware, sidebar, i18n | Low |
| 3 | Admin client, slot utils, handle utils | Low |
| 4 | Public GET API (doctor info + slots) | Medium |
| 5 | Email templates | Low |
| 6 | Public POST API (create appointment) | Medium |
| 7 | Calendar appointments API | Low |
| 8 | Availability + handle API | Medium |
| 9 | DoctorCard component | Low |
| 10 | SlotPicker component | Medium |
| 11 | BookingForm + confirmation | Medium |
| 12 | BookingClient + page shell | Medium |
| 13 | AppointmentEvent + CalendarTab | High |
| 14 | AvailabilityTab | Medium |
| 15 | BookingPageTab + AnalyticsTab | Medium |
| 16 | CalendarPage + route | Medium |
| 17 | Integration testing | Low |
