# Larinova MVP - Doctor Web Application

## Project Overview

**Product Name:** Larinova MVP Web App
**Target Users:** Doctors/Healthcare Professionals
**Tech Stack:** Next.js 16, Shadcn UI, Tailwind CSS v3, Supabase, TypeScript
**Status:** MVP Development Phase

### One-Line Description
Zero-knowledge AI medical platform MVP that enables doctors to manage patients, conduct AI-powered consultations with real-time transcription, and automate prescription/email workflows.

---

## Core Features (MVP Scope)

### 1. Authentication Flow
- **Sign Up**: Doctors can create new accounts
- **Sign In**: Doctors can log into existing accounts
- **No Patient Auth**: Patients receive emails directly (no login required)

### 2. Dashboard (Home Page)
- Statistics overview:
  - Total patients count
  - Today's consultations
  - Pending tasks
  - Recent activity
- Quick actions section
- Latest updates/notifications

### 3. Patients Management
- **View All Patients**: List view with search functionality
- **Search Capabilities**: Search by patient name or patient ID
- **Patient Detail Page**:
  - Complete encrypted health records (MVP: stored in DB without encryption)
  - Past consultation history
  - Current medications
  - Insurance information
  - Health records timeline

### 4. AI-Powered Consultation Sessions (CORE FEATURE)

#### Starting a Session
- "Start Session" button on patient detail page
- Initiates doctor-patient interaction

#### Real-Time Transcription
- **Single Microphone**: Captures both doctor and patient audio
- **Speaker Diarization**: AI distinguishes between doctor and patient speech
- **Multi-Language Support**: Doctor and patient can speak different languages
- **Real-Time Processing**: Transcription happens during the conversation

#### Post-Consultation Flow
1. **AI Summary Report**: Auto-generated consultation summary
2. **Prescription Management**:
   - Doctor can type prescription notes
   - Search and select medicines from database
   - Add custom remarks
3. **Email Automation**:
   - Consultation summary sent to patient's email
   - Prescription details included
   - Fully automated via Resend

### 5. Health Records Display
- Structured display of:
  - Past treatments
  - Current medications
  - Insurance coverage status
  - Medical history
  - Past consultation records

---

## Design System

### Design Philosophy
**Monochrome Brutalist Design** - Clean, bold, professional

### Key Design Elements
- **Color Palette**: Black and white only
- **Typography**:
  - Display font: Bebas Neue (uppercase, bold)
  - Body font: Inter (uppercase for emphasis)
- **Borders**: Sharp, no rounded corners
- **Components**: Shadcn UI (customized to match design)
- **Layout**: Sidebar navigation (desktop-first)

### Reference
Design style matches the landing page at `/landing` directory.

---

## Navigation Structure

### Sidebar Navigation (Left)
```
┌─────────────────┐
│  Larinova LOGO     │
├─────────────────┤
│  🏠 Home        │
│  👥 Patients    │
│  📊 Analytics   │  (Future)
│  ⚙️  Settings   │  (Future)
├─────────────────┤
│  👤 Profile     │
│  🚪 Logout      │
└─────────────────┘
```

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 16.1.x (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **UI Components**: Shadcn UI
- **State Management**: TBD (React Context or Zustand)
- **Forms**: React Hook Form + Zod validation

### Backend/Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (for future use)
- **Real-time**: Supabase Realtime (for future features)

### AI Services
- **Transcription**: AssemblyAI
  - Real-time streaming transcription
  - Speaker diarization
  - Multi-language support
  - Free tier: $50 credits (~2,000+ minutes)

### Email Service
- **Provider**: Resend
- **Usage**: Automated consultation summary emails to patients

---

## Database Schema Overview

### Table Naming Convention
All tables prefixed with `larinova_` to avoid conflicts in shared Supabase project.

### Core Tables
1. `larinova_doctors` - Doctor profiles
2. `larinova_patients` - Patient information
3. `larinova_health_records` - Patient health records
4. `larinova_consultations` - Consultation sessions
5. `larinova_transcripts` - Consultation transcripts
6. `larinova_prescriptions` - Prescription details
7. `larinova_medicines` - Medicine database (mock data)
8. `larinova_insurance` - Patient insurance information

See `DATABASE.md` for detailed schema.

---

## Development Workflow

### Phase 1: Project Setup
1. Initialize Next.js 16 project
2. Install and configure Shadcn UI
3. Set up Tailwind CSS with custom config
4. Configure Supabase client
5. Set up environment variables

### Phase 2: Authentication
1. Implement sign-up flow
2. Implement sign-in flow
3. Protected routes setup
4. Session management

### Phase 3: Dashboard & Navigation
1. Sidebar navigation component
2. Home dashboard with statistics
3. Layout structure

### Phase 4: Patient Management
1. Patient list page with search
2. Patient detail page
3. Health records display

### Phase 5: Consultation Feature (CORE)
1. Start session UI
2. AssemblyAI integration
3. Real-time transcription display
4. Speaker diarization
5. AI summary generation
6. Prescription form
7. Medicine search
8. Email automation via Resend

### Phase 6: Testing & Refinement
1. End-to-end testing
2. UI/UX polish
3. Performance optimization

---

## Key Integration Points

### 1. Supabase Setup
- Create Supabase project
- Run database migrations
- Configure authentication
- Set up Row Level Security (RLS) policies

### 2. AssemblyAI Setup
- Create AssemblyAI account
- Get API key
- Test real-time transcription API
- Implement speaker diarization

### 3. Resend Setup
- Create Resend account
- Get API key
- Create email template
- Test email sending

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AssemblyAI
ASSEMBLYAI_API_KEY=

# Resend
RESEND_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for full list.

---

## Success Criteria (MVP)

### Must Have
✅ Doctor authentication working
✅ Patient list and search functional
✅ Patient detail page displays health records
✅ Start consultation session
✅ Real-time transcription with speaker diarization
✅ AI-generated consultation summary
✅ Prescription creation (type + search medicines)
✅ Automated email to patient with summary + prescription

### Nice to Have (Future)
- Analytics dashboard
- Advanced search filters
- Export consultation reports
- Multi-doctor collaboration
- Patient notifications

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint

# Database migrations
npm run db:migrate

# Seed mock data
npm run db:seed
```

---

## File Structure

```
app/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Home)
│   │   ├── patients/
│   │   │   ├── page.tsx (Patient List)
│   │   │   └── [id]/
│   │   │       ├── page.tsx (Patient Detail)
│   │   │       └── consultation/
│   │   │           └── page.tsx (Active Consultation)
│   │   └── settings/
│   ├── api/
│   │   ├── consultation/
│   │   ├── prescription/
│   │   └── email/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (Shadcn components)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── patients/
│   ├── consultation/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── assemblyai/
│   ├── resend/
│   └── utils/
├── types/
├── hooks/
├── styles/
└── public/
```

---

## Next Steps

1. Read `SETUP.md` for detailed setup instructions
2. Read `DATABASE.md` for database schema and migrations
3. Read `API_INTEGRATION.md` for AI and email integration guides
4. Read `DESIGN_GUIDELINES.md` for UI/UX implementation
5. Read `FEATURES.md` for detailed feature specifications

---

## Important Notes

### For MVP Simplification
- **No encryption**: Health records stored in plain text in Supabase
- **No patient authentication**: Patients receive emails directly
- **Mock medicine data**: Pre-populated medicine list in database
- **Basic UI**: Focus on functionality over animations
- **Single doctor**: No multi-doctor collaboration features

### Future Enhancements (Post-MVP)
- End-to-end encryption for health records
- Patient mobile app with authentication
- Real zkLLM integration
- Embedded AI assistant
- Advanced analytics
- Multi-language UI
- Telemedicine video calls

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
**Author:** Product Team
