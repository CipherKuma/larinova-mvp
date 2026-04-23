# Larinova MVP - Feature Specifications

This document provides detailed specifications for each feature in the MVP.

---

## Table of Contents

1. [Authentication System](#1-authentication-system)
2. [Dashboard (Home)](#2-dashboard-home)
3. [Patient Management](#3-patient-management)
4. [Patient Detail Page](#4-patient-detail-page)
5. [Consultation Session](#5-consultation-session)
6. [Prescription Creation](#6-prescription-creation)
7. [Email Automation](#7-email-automation)

---

## 1. Authentication System

### Overview
Doctors can sign up and sign in to access the platform. No patient authentication in MVP.

### 1.1 Sign Up

**Route**: `/sign-up`

**UI Components**:
- Logo at top
- Form with fields:
  - Full Name (text input)
  - Email (email input with validation)
  - Password (password input, min 8 characters)
  - Specialization (text input)
  - License Number (text input, optional)
- "SIGN UP" button
- Link to sign in page

**Implementation**:

```typescript
// app/(auth)/sign-up/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Create doctor profile
      const { error: profileError } = await supabase
        .from('larinova_doctors')
        .insert({
          user_id: authData.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          specialization: formData.specialization,
          license_number: formData.licenseNumber || null,
        });

      if (profileError) throw profileError;

      // 3. Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
      alert('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md border-4 border-black p-8">
        <h1 className="text-display-lg font-display uppercase text-center mb-8">
          Larinova
        </h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Form fields */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Database Operations**:
1. Create user in `auth.users` (Supabase Auth)
2. Create doctor profile in `larinova_doctors`

**Validation**:
- Email format validation
- Password minimum 8 characters
- Full name required
- Specialization required

---

### 1.2 Sign In

**Route**: `/sign-in`

**UI Components**:
- Logo
- Email input
- Password input
- "SIGN IN" button
- "Forgot password?" link (future)
- Link to sign up page

**Implementation**:

```typescript
// app/(auth)/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Similar UI structure to sign up
  );
}
```

**Session Management**:
- Use Supabase Auth session
- Redirect to dashboard on success
- Show error on failure

---

## 2. Dashboard (Home)

### Overview
Doctor's home page showing overview statistics and quick actions.

**Route**: `/dashboard`

**Layout**:
- Sidebar navigation (left)
- Main content area

**Sections**:

### 2.1 Statistics Cards

Display key metrics in a grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    title="TOTAL PATIENTS"
    value={124}
    icon={<Users />}
  />
  <StatCard
    title="TODAY'S CONSULTATIONS"
    value={8}
    icon={<Calendar />}
  />
  <StatCard
    title="PENDING TASKS"
    value={3}
    icon={<AlertCircle />}
  />
  <StatCard
    title="THIS WEEK"
    value={42}
    icon={<Activity />}
  />
</div>
```

**Data Source**:
```sql
-- Total patients
SELECT COUNT(*) FROM larinova_patients WHERE created_by_doctor_id = ?

-- Today's consultations
SELECT COUNT(*) FROM larinova_consultations
WHERE doctor_id = ? AND DATE(start_time) = CURRENT_DATE

-- This week's consultations
SELECT COUNT(*) FROM larinova_consultations
WHERE doctor_id = ?
AND start_time >= DATE_TRUNC('week', CURRENT_DATE)
```

### 2.2 Quick Actions

Prominent buttons for common actions:

```tsx
<div className="space-y-4">
  <Button onClick={() => router.push('/patients/new')}>
    + NEW PATIENT
  </Button>
  <Button onClick={() => router.push('/patients')}>
    VIEW ALL PATIENTS
  </Button>
</div>
```

### 2.3 Recent Activity

List of recent consultations:

```tsx
<div className="space-y-4">
  <h2 className="text-display-md font-display uppercase">
    RECENT ACTIVITY
  </h2>
  {recentConsultations.map(consultation => (
    <div className="border border-black p-4">
      <div className="flex justify-between">
        <div>
          <div className="font-semibold">{consultation.patient_name}</div>
          <div className="text-sm text-gray-600">
            {formatDate(consultation.start_time)}
          </div>
        </div>
        <Badge>{consultation.status}</Badge>
      </div>
    </div>
  ))}
</div>
```

**API Endpoint**:
```typescript
// app/api/dashboard/stats/route.ts
export async function GET(req: Request) {
  const supabase = await createClient();

  // Get current doctor
  const { data: { user } } = await supabase.auth.getUser();

  const { data: doctor } = await supabase
    .from('larinova_doctors')
    .select('id')
    .eq('user_id', user?.id)
    .single();

  // Fetch all stats in parallel
  const [
    totalPatients,
    todayConsultations,
    weekConsultations,
    recentActivity
  ] = await Promise.all([
    // Query implementations...
  ]);

  return Response.json({
    totalPatients,
    todayConsultations,
    weekConsultations,
    recentActivity,
  });
}
```

---

## 3. Patient Management

### Overview
View and search all patients.

**Route**: `/patients`

### 3.1 Patient List

**UI Components**:
- Search bar at top
- Table/card view of patients
- Pagination (if needed)

```tsx
// app/(dashboard)/patients/page.tsx
export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = await createClient();

  // Get current doctor
  const { data: { user } } = await supabase.auth.getUser();
  const { data: doctor } = await supabase
    .from('larinova_doctors')
    .select('id')
    .eq('user_id', user?.id)
    .single();

  // Search query
  let query = supabase
    .from('larinova_patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchParams.q) {
    query = query.or(`
      full_name.ilike.%${searchParams.q}%,
      patient_code.ilike.%${searchParams.q}%,
      email.ilike.%${searchParams.q}%
    `);
  }

  const { data: patients } = await query;

  return (
    <div>
      <SearchBar />
      <PatientTable patients={patients} />
    </div>
  );
}
```

**Search Implementation**:

```tsx
// components/patients/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/patients?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="SEARCH BY NAME OR ID..."
        className="w-full pl-12 pr-4 py-3 border border-black uppercase text-sm"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
    </form>
  );
}
```

### 3.2 Patient Table

```tsx
// components/patients/PatientTable.tsx
export function PatientTable({ patients }: { patients: any[] }) {
  return (
    <div className="border border-black">
      <table className="w-full">
        <thead className="bg-black text-white">
          <tr>
            <th className="px-6 py-4 text-left uppercase text-sm">ID</th>
            <th className="px-6 py-4 text-left uppercase text-sm">Name</th>
            <th className="px-6 py-4 text-left uppercase text-sm">Email</th>
            <th className="px-6 py-4 text-left uppercase text-sm">Age</th>
            <th className="px-6 py-4 text-left uppercase text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-t border-black hover:bg-gray-50">
              <td className="px-6 py-4">{patient.patient_code}</td>
              <td className="px-6 py-4 font-semibold">{patient.full_name}</td>
              <td className="px-6 py-4">{patient.email}</td>
              <td className="px-6 py-4">{calculateAge(patient.date_of_birth)}</td>
              <td className="px-6 py-4">
                <Link
                  href={`/patients/${patient.id}`}
                  className="uppercase text-sm underline"
                >
                  VIEW
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 4. Patient Detail Page

### Overview
View complete patient information and health records.

**Route**: `/patients/[id]`

**Sections**:

### 4.1 Patient Header

```tsx
<div className="border border-black p-6 mb-6">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-display-lg font-display uppercase">
        {patient.full_name}
      </h1>
      <div className="text-sm uppercase text-gray-600 mt-2">
        ID: {patient.patient_code}
      </div>
    </div>
    <Button onClick={() => router.push(`/patients/${patient.id}/consultation`)}>
      START SESSION
    </Button>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    <InfoItem label="EMAIL" value={patient.email} />
    <InfoItem label="PHONE" value={patient.phone} />
    <InfoItem label="BLOOD GROUP" value={patient.blood_group} />
    <InfoItem label="AGE" value={calculateAge(patient.date_of_birth)} />
  </div>
</div>
```

### 4.2 Tabs Navigation

```tsx
<Tabs defaultValue="records">
  <TabsList>
    <TabsTrigger value="records">HEALTH RECORDS</TabsTrigger>
    <TabsTrigger value="consultations">CONSULTATIONS</TabsTrigger>
    <TabsTrigger value="prescriptions">PRESCRIPTIONS</TabsTrigger>
    <TabsTrigger value="insurance">INSURANCE</TabsTrigger>
  </TabsList>

  <TabsContent value="records">
    <HealthRecordsView patientId={patient.id} />
  </TabsContent>

  {/* Other tabs */}
</Tabs>
```

### 4.3 Health Records View

```tsx
// components/patients/HealthRecordsView.tsx
export function HealthRecordsView({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchHealthRecords();
  }, [patientId]);

  const fetchHealthRecords = async () => {
    const response = await fetch(`/api/patients/${patientId}/records`);
    const data = await response.json();
    setRecords(data);
  };

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.id} className="border border-black p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-display text-xl uppercase">
                {record.title}
              </h3>
              <Badge className="mt-2">{record.record_type}</Badge>
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(record.record_date)}
            </div>
          </div>
          <p className="text-base">{record.description}</p>
        </div>
      ))}
    </div>
  );
}
```

**API Endpoint**:
```typescript
// app/api/patients/[id]/records/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('larinova_health_records')
    .select('*')
    .eq('patient_id', params.id)
    .order('record_date', { ascending: false });

  return Response.json(data);
}
```

### 4.4 Past Consultations View

```tsx
export function ConsultationsView({ patientId }: { patientId: string }) {
  // Fetch consultations for this patient
  // Display in chronological order
  // Show consultation summary, date, doctor, diagnosis

  return (
    <div className="space-y-4">
      {consultations.map((consultation) => (
        <div key={consultation.id} className="border border-black p-6">
          <div className="flex justify-between mb-4">
            <div>
              <div className="font-semibold">
                {formatDateTime(consultation.start_time)}
              </div>
              <div className="text-sm text-gray-600">
                Duration: {consultation.duration_minutes} minutes
              </div>
            </div>
            <Badge>{consultation.status}</Badge>
          </div>

          {consultation.diagnosis && (
            <div className="mb-4">
              <div className="text-sm uppercase font-semibold mb-2">
                DIAGNOSIS
              </div>
              <p>{consultation.diagnosis}</p>
            </div>
          )}

          {consultation.summary && (
            <div>
              <div className="text-sm uppercase font-semibold mb-2">
                SUMMARY
              </div>
              <p>{consultation.summary}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 4.5 Insurance View

```tsx
export function InsuranceView({ patientId }: { patientId: string }) {
  // Fetch insurance information
  // Display active policies

  return (
    <div className="space-y-4">
      {insurancePolicies.map((policy) => (
        <div key={policy.id} className="border border-black p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-display text-xl uppercase">
                {policy.provider_name}
              </h3>
              <div className="text-sm text-gray-600 mt-2">
                Policy: {policy.policy_number}
              </div>
            </div>
            <Badge className={policy.is_active ? 'bg-green-100' : 'bg-red-100'}>
              {policy.is_active ? 'ACTIVE' : 'EXPIRED'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              label="COVERAGE TYPE"
              value={policy.coverage_type}
            />
            <InfoItem
              label="VALID UNTIL"
              value={formatDate(policy.valid_until)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Consultation Session

### Overview
Real-time AI-powered consultation with transcription.

**Route**: `/patients/[id]/consultation`

### 5.1 Consultation Setup

When doctor clicks "START SESSION":

1. Create consultation record in database
2. Navigate to consultation page
3. Initialize audio capture
4. Start transcription service

**Implementation**:

```typescript
// app/api/consultations/start/route.ts
export async function POST(req: Request) {
  const { patientId } = await req.json();
  const supabase = await createClient();

  // Get current doctor
  const { data: { user } } = await supabase.auth.getUser();
  const { data: doctor } = await supabase
    .from('larinova_doctors')
    .select('id')
    .eq('user_id', user?.id)
    .single();

  // Create consultation
  const { data: consultation } = await supabase
    .from('larinova_consultations')
    .insert({
      patient_id: patientId,
      doctor_id: doctor.id,
      start_time: new Date().toISOString(),
      status: 'in_progress',
    })
    .select()
    .single();

  return Response.json({ consultation });
}
```

### 5.2 Consultation UI

```tsx
// app/(dashboard)/patients/[id]/consultation/page.tsx
'use client';

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);

  const startConsultation = async () => {
    // Call API to create consultation
    const response = await fetch('/api/consultations/start', {
      method: 'POST',
      body: JSON.stringify({ patientId: params.id }),
    });
    const { consultation } = await response.json();
    setConsultationId(consultation.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-display-lg font-display uppercase">
          CONSULTATION SESSION
        </h1>
        <div className="flex gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              RECORDING
            </div>
          )}
        </div>
      </div>

      {/* Transcription View */}
      <TranscriptionView
        consultationId={consultationId}
        isRecording={isRecording}
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
        transcripts={transcripts}
        onTranscriptUpdate={setTranscripts}
      />

      {/* Consultation Notes */}
      <ConsultationNotes consultationId={consultationId} />

      {/* Complete Consultation Button */}
      <Button
        onClick={handleCompleteConsultation}
        className="w-full"
        disabled={!consultationId || isRecording}
      >
        COMPLETE CONSULTATION
      </Button>
    </div>
  );
}
```

### 5.3 Real-Time Transcription Component

(See API_INTEGRATION.md for full implementation)

Key features:
- Start/stop recording button
- Real-time transcript display
- Speaker identification (doctor vs patient)
- Language detection
- Confidence scores

---

## 6. Prescription Creation

### Overview
After consultation, doctor creates prescription.

**Route**: `/consultations/[id]/prescription`

### 6.1 Prescription Form

```tsx
// components/consultation/PrescriptionForm.tsx
'use client';

export function PrescriptionForm({ consultationId }: { consultationId: string }) {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchMedicines = async (query: string) => {
    if (query.length < 2) return;

    const response = await fetch(`/api/medicines/search?q=${query}`);
    const data = await response.json();
    setSearchResults(data);
  };

  const addMedicine = (medicine: any) => {
    setMedicines([...medicines, {
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/prescriptions/create', {
      method: 'POST',
      body: JSON.stringify({
        consultationId,
        medicines,
        doctorNotes,
      }),
    });

    if (response.ok) {
      // Proceed to send email
    }
  };

  return (
    <div className="space-y-6">
      {/* Medicine Search */}
      <div>
        <label className="text-sm uppercase font-semibold mb-2 block">
          SEARCH MEDICINES
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchMedicines(e.target.value);
          }}
          placeholder="Type medicine name..."
          className="w-full px-4 py-3 border border-black"
        />

        {searchResults.length > 0 && (
          <div className="border border-black mt-2 max-h-60 overflow-y-auto">
            {searchResults.map((medicine) => (
              <div
                key={medicine.id}
                onClick={() => addMedicine(medicine)}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
              >
                <div className="font-semibold">{medicine.name}</div>
                <div className="text-sm text-gray-600">
                  {medicine.generic_name} • {medicine.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Medicines */}
      <div>
        <h3 className="text-display-sm font-display uppercase mb-4">
          SELECTED MEDICINES
        </h3>
        {medicines.map((medicine, index) => (
          <div key={index} className="border border-black p-4 mb-4">
            <div className="font-semibold mb-4">{medicine.medicine_name}</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase mb-2 block">DOSAGE</label>
                <input
                  type="text"
                  value={medicine.dosage}
                  onChange={(e) => {
                    const updated = [...medicines];
                    updated[index].dosage = e.target.value;
                    setMedicines(updated);
                  }}
                  placeholder="e.g., 500mg"
                  className="w-full px-3 py-2 border border-black"
                />
              </div>

              <div>
                <label className="text-xs uppercase mb-2 block">FREQUENCY</label>
                <input
                  type="text"
                  value={medicine.frequency}
                  onChange={(e) => {
                    const updated = [...medicines];
                    updated[index].frequency = e.target.value;
                    setMedicines(updated);
                  }}
                  placeholder="e.g., Twice daily"
                  className="w-full px-3 py-2 border border-black"
                />
              </div>

              <div>
                <label className="text-xs uppercase mb-2 block">DURATION</label>
                <input
                  type="text"
                  value={medicine.duration}
                  onChange={(e) => {
                    const updated = [...medicines];
                    updated[index].duration = e.target.value;
                    setMedicines(updated);
                  }}
                  placeholder="e.g., 7 days"
                  className="w-full px-3 py-2 border border-black"
                />
              </div>

              <div>
                <label className="text-xs uppercase mb-2 block">INSTRUCTIONS</label>
                <input
                  type="text"
                  value={medicine.instructions}
                  onChange={(e) => {
                    const updated = [...medicines];
                    updated[index].instructions = e.target.value;
                    setMedicines(updated);
                  }}
                  placeholder="e.g., Take after meals"
                  className="w-full px-3 py-2 border border-black"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setMedicines(medicines.filter((_, i) => i !== index));
              }}
              className="mt-4 text-sm uppercase underline"
            >
              REMOVE
            </button>
          </div>
        ))}
      </div>

      {/* Doctor Notes */}
      <div>
        <label className="text-sm uppercase font-semibold mb-2 block">
          DOCTOR'S NOTES
        </label>
        <textarea
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          placeholder="Additional notes or instructions..."
          rows={4}
          className="w-full px-4 py-3 border border-black"
        />
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} className="w-full">
        CREATE PRESCRIPTION & SEND EMAIL
      </Button>
    </div>
  );
}
```

### 6.2 Medicine Search API

```typescript
// app/api/medicines/search/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return Response.json([]);
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from('larinova_medicines')
    .select('*')
    .or(`name.ilike.%${query}%, generic_name.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(10);

  return Response.json(data);
}
```

---

## 7. Email Automation

### Overview
Automatically send consultation summary and prescription to patient email.

### 7.1 Trigger Email

After prescription is created:

```typescript
// app/api/prescriptions/create/route.ts
export async function POST(req: Request) {
  const { consultationId, medicines, doctorNotes } = await req.json();
  const supabase = await createClient();

  // 1. Create prescription
  const { data: prescription } = await supabase
    .from('larinova_prescriptions')
    .insert({
      consultation_id: consultationId,
      doctor_notes: doctorNotes,
    })
    .select()
    .single();

  // 2. Add prescription items
  const items = medicines.map((med: any) => ({
    prescription_id: prescription.id,
    ...med,
  }));

  await supabase
    .from('larinova_prescription_items')
    .insert(items);

  // 3. Update consultation status
  await supabase
    .from('larinova_consultations')
    .update({
      status: 'completed',
      end_time: new Date().toISOString(),
    })
    .eq('id', consultationId);

  // 4. Send email
  await fetch('/api/consultation/send-summary', {
    method: 'POST',
    body: JSON.stringify({ consultationId }),
  });

  return Response.json({ success: true });
}
```

### 7.2 Email Content

(See API_INTEGRATION.md for full email template)

Email includes:
- Patient name
- Doctor name
- Consultation date and time
- Consultation summary (AI-generated)
- Diagnosis
- Complete prescription with dosage/instructions
- Doctor's notes
- Larinova branding

---

## Implementation Order

**Recommended development sequence**:

1. ✅ Project setup (Next.js, Shadcn, Supabase)
2. ✅ Database migration
3. ✅ Authentication (sign up/sign in)
4. ✅ Dashboard layout with sidebar
5. ✅ Dashboard statistics
6. ✅ Patient list & search
7. ✅ Patient detail page
8. ✅ Health records display
9. ✅ Start consultation flow
10. ✅ AssemblyAI integration (transcription)
11. ✅ Prescription form
12. ✅ Medicine search
13. ✅ Resend email integration
14. ✅ Complete end-to-end flow testing

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
