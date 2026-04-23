# Larinova MVP - Doctor Web Application

Zero-knowledge AI medical platform that enables doctors to manage patients, conduct AI-powered consultations with real-time transcription, and automate prescription/email workflows.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- AssemblyAI account (free $50 credits)
- Resend account (free 3,000 emails/month)

### Setup in 5 Steps

```bash
# 1. Initialize Next.js project
cd app
npx create-next-app@latest . --typescript --tailwind --app

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr resend assemblyai
npm install zod react-hook-form lucide-react clsx tailwind-merge

# 3. Set up Shadcn UI
npx shadcn@latest init
npx shadcn@latest add button input form card table dialog tabs badge

# 4. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 5. Run migrations in Supabase
# Copy SQL from DATABASE.md to Supabase SQL Editor and run

# Start development server
npm run dev
```

---

## 📚 Documentation

### Essential Reading

1. **[PROJECT.md](./PROJECT.md)** - Start here
   - Project overview and architecture
   - Tech stack details
   - Core features summary
   - Development workflow

2. **[SETUP.md](./SETUP.md)** - Step-by-step setup
   - Detailed installation instructions
   - Supabase configuration
   - API service setup (AssemblyAI, Resend)
   - Troubleshooting guide

3. **[DATABASE.md](./DATABASE.md)** - Database schema
   - Complete table definitions
   - SQL migration scripts
   - Row Level Security policies
   - Mock data seeding

4. **[API_INTEGRATION.md](./API_INTEGRATION.md)** - External services
   - AssemblyAI real-time transcription
   - Speaker diarization implementation
   - Resend email automation
   - Code examples and testing

5. **[DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)** - UI/UX standards
   - Monochrome brutalist design system
   - Component specifications
   - Typography and spacing
   - Accessibility guidelines

6. **[FEATURES.md](./FEATURES.md)** - Feature specifications
   - Detailed implementation guides
   - Code examples for each feature
   - API endpoints
   - Implementation order

---

## 🏗️ Project Structure

```
app/
├── 📄 PROJECT.md              # Project overview (START HERE)
├── 📄 SETUP.md                # Setup instructions
├── 📄 DATABASE.md             # Database schema
├── 📄 API_INTEGRATION.md      # API integration guides
├── 📄 DESIGN_GUIDELINES.md    # UI/UX guidelines
├── 📄 FEATURES.md             # Feature specifications
├── 📄 .env.example            # Environment variables template
│
├── app/                       # Next.js App Router
│   ├── (auth)/               # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   ├── page.tsx          # Home/Dashboard
│   │   └── patients/         # Patient management
│   ├── api/                  # API routes
│   │   ├── consultation/     # Consultation APIs
│   │   ├── prescription/     # Prescription APIs
│   │   └── medicines/        # Medicine search API
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/               # React components
│   ├── ui/                   # Shadcn UI components
│   ├── layout/               # Layout components (Sidebar, Header)
│   ├── patients/             # Patient-related components
│   ├── consultation/         # Consultation components
│   └── shared/               # Shared/common components
│
├── lib/                      # Utility libraries
│   ├── supabase/            # Supabase client setup
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server client
│   ├── assemblyai/          # AssemblyAI integration
│   ├── resend/              # Resend email integration
│   └── utils.ts             # Utility functions
│
├── types/                    # TypeScript type definitions
│   └── database.ts          # Database types
│
├── hooks/                    # Custom React hooks
├── public/                   # Static assets
│   └── fonts/               # Bebas Neue font
│
├── .env.local               # Environment variables (create from .env.example)
├── .env.example             # Environment variables template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

---

## 🎯 Core Features

### 1. Authentication
- Doctor sign up/sign in
- Supabase Auth integration
- Protected routes

### 2. Dashboard
- Statistics overview
- Quick actions
- Recent activity

### 3. Patient Management
- View all patients
- Search by name or ID
- Patient detail pages
- Health records display

### 4. AI-Powered Consultations ⭐
- Real-time audio transcription
- Speaker diarization (doctor vs patient)
- Multi-language support
- AI-generated summaries

### 5. Prescription Management
- Search medicines from database
- Create digital prescriptions
- Doctor notes

### 6. Email Automation
- Automated consultation summaries
- Prescription delivery to patient email
- Professional email templates

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v3** - Utility-first styling
- **Shadcn UI** - Customizable component library
- **Lucide React** - Icons

### Backend & Database
- **Supabase** - PostgreSQL database + authentication
- **Supabase Auth** - User authentication
- **Row Level Security** - Data access control

### AI & Services
- **AssemblyAI** - Real-time transcription + speaker diarization
- **Resend** - Transactional emails

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting (optional)

---

## 🎨 Design System

**Monochrome Brutalist Design**

- **Colors**: Black, white, and gray shades only
- **Typography**: Bebas Neue (display) + Inter (body)
- **Borders**: Sharp edges, no rounded corners
- **Components**: Border-based, high contrast
- **Style**: Professional, clean, functional

See [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) for complete specifications.

---

## 📦 Database Schema

All tables use `larinova_` prefix to avoid conflicts.

**Core Tables:**
- `larinova_doctors` - Doctor profiles
- `larinova_patients` - Patient information
- `larinova_consultations` - Consultation sessions
- `larinova_transcripts` - Real-time transcriptions
- `larinova_prescriptions` - Prescription records
- `larinova_medicines` - Medicine database
- `larinova_health_records` - Patient health records
- `larinova_insurance` - Insurance information

See [DATABASE.md](./DATABASE.md) for complete schema and migrations.

---

## 🔑 Environment Variables

Required environment variables (see [.env.example](./.env.example)):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AssemblyAI
ASSEMBLYAI_API_KEY=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚦 Getting Started Checklist

Follow this checklist to get started:

### Phase 1: Setup (Day 1)
- [ ] Read [PROJECT.md](./PROJECT.md)
- [ ] Follow [SETUP.md](./SETUP.md) for installation
- [ ] Create Supabase project and get credentials
- [ ] Create AssemblyAI account (get $50 free credits)
- [ ] Create Resend account
- [ ] Configure `.env.local` with all API keys
- [ ] Run database migrations from [DATABASE.md](./DATABASE.md)
- [ ] Test API connections

### Phase 2: Authentication (Day 2)
- [ ] Read authentication section in [FEATURES.md](./FEATURES.md)
- [ ] Implement sign-up page
- [ ] Implement sign-in page
- [ ] Set up protected routes
- [ ] Test authentication flow

### Phase 3: Dashboard (Day 3)
- [ ] Implement sidebar navigation
- [ ] Create dashboard layout
- [ ] Build statistics cards
- [ ] Fetch and display data
- [ ] Test responsive design

### Phase 4: Patient Management (Days 4-5)
- [ ] Implement patient list page
- [ ] Add search functionality
- [ ] Create patient detail page
- [ ] Display health records
- [ ] Add insurance view
- [ ] Show past consultations

### Phase 5: Consultation Feature (Days 6-8)
- [ ] Read [API_INTEGRATION.md](./API_INTEGRATION.md) for AssemblyAI
- [ ] Implement consultation start flow
- [ ] Integrate real-time transcription
- [ ] Add speaker diarization
- [ ] Build transcription UI
- [ ] Test with real audio

### Phase 6: Prescription (Day 9)
- [ ] Create medicine search API
- [ ] Build prescription form
- [ ] Implement medicine selection
- [ ] Add prescription creation
- [ ] Test complete flow

### Phase 7: Email Automation (Day 10)
- [ ] Read Resend section in [API_INTEGRATION.md](./API_INTEGRATION.md)
- [ ] Create email templates
- [ ] Implement email sending
- [ ] Test email delivery
- [ ] Verify email formatting

### Phase 8: Polish & Testing (Days 11-12)
- [ ] Review [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md)
- [ ] Polish UI components
- [ ] Test all features end-to-end
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Prepare demo

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Doctor can sign up with valid credentials
- [ ] Doctor can sign in with existing account
- [ ] Invalid credentials show error
- [ ] Authenticated user redirected to dashboard

**Dashboard:**
- [ ] Statistics display correctly
- [ ] Recent activity shows latest consultations
- [ ] Quick actions navigate to correct pages

**Patient Management:**
- [ ] Patient list loads
- [ ] Search by name works
- [ ] Search by ID works
- [ ] Patient detail page shows all data

**Consultation:**
- [ ] Can start new consultation
- [ ] Microphone access requested
- [ ] Real-time transcription works
- [ ] Speaker identification working
- [ ] Can stop consultation
- [ ] Summary generated

**Prescription:**
- [ ] Medicine search returns results
- [ ] Can add medicines to prescription
- [ ] Can fill dosage/frequency/duration
- [ ] Can add doctor notes
- [ ] Prescription saved to database

**Email:**
- [ ] Email sent after consultation
- [ ] Email contains summary
- [ ] Email contains prescription
- [ ] Email formatting correct

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Supabase connection failed**
- Verify API keys in `.env.local`
- Check if project is initialized in Supabase dashboard
- Ensure RLS policies are set correctly

**Issue: AssemblyAI 401 error**
- Verify API key is correct
- Check if key is properly set in `.env.local`
- Restart dev server after changing env variables

**Issue: Shadcn components not styled**
- Run `npx shadcn@latest init` first
- Check `tailwind.config.ts` includes component paths
- Verify `globals.css` imports

**Issue: Email not sending**
- Verify Resend API key
- Check email sender address
- For development, send to your own email first
- Check Resend dashboard for logs

See [SETUP.md](./SETUP.md#troubleshooting) for more details.

---

## 📖 Additional Resources

### Official Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [AssemblyAI Docs](https://www.assemblyai.com/docs)
- [Resend Docs](https://resend.com/docs)
- [Shadcn UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Learning Resources
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Supabase Auth Tutorial](https://supabase.com/docs/guides/auth)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 🤝 Development Workflow

### Recommended Approach

1. **Read Documentation First**
   - Start with PROJECT.md for overview
   - Read SETUP.md for installation
   - Review FEATURES.md for feature you're building

2. **Build Feature by Feature**
   - Complete one feature before moving to next
   - Test thoroughly after each feature
   - Commit changes frequently

3. **Follow Design Guidelines**
   - Refer to DESIGN_GUIDELINES.md
   - Use provided component examples
   - Maintain consistent styling

4. **Test Integrations Early**
   - Test API connections before building UI
   - Verify database queries work
   - Check authentication flow first

5. **Use Skills for Development**
   - Use Shadcn UI skill for component generation
   - Use Supabase skill for database operations
   - Refer to code examples in documentation

---

## 📝 Development Notes

### Table Naming Convention
All database tables use `larinova_` prefix to avoid conflicts in shared Supabase projects.

### API Routes Organization
- `/api/consultation/*` - Consultation-related APIs
- `/api/patients/*` - Patient management APIs
- `/api/prescription/*` - Prescription APIs
- `/api/medicines/*` - Medicine search APIs

### Component Organization
- `app/(auth)` - Public authentication pages
- `app/(dashboard)` - Protected dashboard pages
- `components/ui` - Reusable UI components
- `components/[feature]` - Feature-specific components

---

## 🎯 MVP Scope

**What's Included:**
✅ Doctor authentication
✅ Patient management
✅ Real-time consultation transcription
✅ Prescription creation
✅ Email automation
✅ Basic UI/UX

**What's Not Included (Future):**
❌ Patient authentication (patients receive emails only)
❌ End-to-end encryption (data stored in plain text)
❌ Real zkLLM integration (using standard LLM)
❌ Embedded AI assistant (future feature)
❌ Payment processing
❌ Multi-doctor collaboration
❌ Analytics dashboard

---

## 🚀 Deployment

*Coming soon - deployment guide for production*

Recommended platforms:
- **Vercel** - Frontend hosting
- **Supabase** - Database and auth (already set up)
- **AssemblyAI** - Transcription service
- **Resend** - Email service

---

## 📞 Support

For questions or issues:
1. Check the relevant documentation file
2. Review troubleshooting section
3. Check Supabase/AssemblyAI/Resend documentation
4. Create an issue in project repository

---

## 📄 License

*Add your license information here*

---

**Last Updated:** January 23, 2026
**Version:** 1.0.0
**Status:** MVP Development Phase
