# Larinova MVP - Setup Instructions

## Prerequisites

Before starting, ensure you have:
- **Node.js**: v18.x or higher
- **npm** or **yarn** package manager
- **Git**: For version control
- **Code Editor**: VS Code recommended
- **Supabase Account**: Sign up at https://supabase.com
- **AssemblyAI Account**: Sign up at https://www.assemblyai.com
- **Resend Account**: Sign up at https://resend.com

---

## Step 1: Initialize Next.js Project

```bash
# Navigate to app directory
cd /Users/gabrielantonyxaviour/Documents/products/larinova/app

# Initialize Next.js 16 with TypeScript
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Answer prompts:
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Turbopack? No
# ✔ Would you like to customize the import alias? No
```

---

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install resend
npm install assemblyai
npm install zod react-hook-form @hookform/resolvers
npm install zustand # State management (optional)
npm install clsx tailwind-merge
npm install lucide-react # Icons
npm install framer-motion # Animations (optional)
npm install date-fns # Date formatting

# Dev dependencies
npm install -D @types/node
```

---

## Step 3: Set Up Shadcn UI

```bash
# Initialize Shadcn UI
npx shadcn@latest init

# Answer prompts:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Neutral
# ✔ Would you like to use CSS variables for colors? › Yes

# Install required Shadcn components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add scroll-area
npx shadcn@latest add command
```

---

## Step 4: Configure Tailwind CSS

Update `tailwind.config.ts` to match landing page design:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        border: "#000000",
        primary: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-bebas)', 'sans-serif'],
      },
      borderRadius: {
        lg: "0px", // No rounded corners
        md: "0px",
        sm: "0px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## Step 5: Set Up Fonts

Update `app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebas = localFont({
  src: '../public/fonts/BebasNeue-Regular.ttf', // Download Bebas Neue
  variable: '--font-bebas',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Download Bebas Neue:**
1. Go to https://fonts.google.com/specimen/Bebas+Neue
2. Download font files
3. Place `BebasNeue-Regular.ttf` in `public/fonts/`

---

## Step 6: Set Up Supabase

### 6.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: larinova-mvp
   - **Database Password**: [Generate strong password]
   - **Region**: Choose closest to your location
4. Wait for project to initialize (~2 minutes)

### 6.2 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...`
   - **Service Role Key**: `eyJhbGc...` (keep secret!)

### 6.3 Create Database Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the SQL from `DATABASE.md`
3. Run the migration scripts

---

## Step 7: Set Up AssemblyAI

### 7.1 Create Account

1. Go to https://www.assemblyai.com
2. Sign up for free account
3. You get **$50 in free credits** (~2,000+ minutes of audio)

### 7.2 Get API Key

1. Go to dashboard
2. Copy your **API Key**
3. Test with a simple curl request:

```bash
curl --request GET \
  --url 'https://api.assemblyai.com/v2/transcript' \
  --header "Authorization: YOUR_API_KEY"
```

---

## Step 8: Set Up Resend

### 8.1 Create Account

1. Go to https://resend.com
2. Sign up for free account
3. Free tier: **100 emails/day**, **3,000 emails/month**

### 8.2 Get API Key

1. Go to **API Keys** section
2. Click **"Create API Key"**
3. Name it: `larinova-mvp`
4. Copy the key (starts with `re_`)

### 8.3 Verify Domain (Optional for MVP)

For production emails, verify your domain. For MVP, you can send to your own email only.

---

## Step 9: Create Environment Variables

Create `.env.local` in root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# Resend Configuration
RESEND_API_KEY=re_xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Larinova

# Email Configuration
EMAIL_FROM=hello@larinova.com
```

---

## Step 10: Create Utility Files

### 10.1 Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component
          }
        },
      },
    }
  );
}
```

### 10.2 Utility Functions

Create `lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 11: Update Global Styles

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;
    --border: 0 0% 0%;
    --primary: 0 0% 0%;
    --primary-foreground: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans;
  }

  /* Uppercase utility */
  .uppercase-text {
    @apply uppercase tracking-wider;
  }

  /* Focus ring utility */
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2;
  }
}
```

---

## Step 12: Create Type Definitions

Create `types/database.ts`:

```typescript
export type Doctor = {
  id: string;
  email: string;
  full_name: string;
  specialization?: string;
  license_number?: string;
  created_at: string;
};

export type Patient = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  blood_group?: string;
  gender?: string;
  address?: string;
  created_at: string;
};

export type HealthRecord = {
  id: string;
  patient_id: string;
  record_type: string;
  record_date: string;
  description: string;
  doctor_id?: string;
  attachments?: string[];
  created_at: string;
};

export type Consultation = {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time?: string;
  summary?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
};

export type Prescription = {
  id: string;
  consultation_id: string;
  medicines: PrescriptionMedicine[];
  doctor_notes?: string;
  created_at: string;
};

export type PrescriptionMedicine = {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type Medicine = {
  id: string;
  name: string;
  generic_name?: string;
  category: string;
  manufacturer?: string;
  common_dosages: string[];
};
```

---

## Step 13: Verify Installation

```bash
# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:3000

# You should see Next.js default page
```

---

## Step 14: Test Integrations

### Test Supabase Connection

Create `app/api/test-supabase/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('larinova_doctors').select('count');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
```

Test: `curl http://localhost:3000/api/test-supabase`

### Test AssemblyAI Connection

Create `app/api/test-assemblyai/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    headers: {
      'Authorization': process.env.ASSEMBLYAI_API_KEY!,
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ success: true, data });
}
```

Test: `curl http://localhost:3000/api/test-assemblyai`

---

## Step 15: Project Structure

Your final structure should look like:

```
app/
├── .env.local (DO NOT commit)
├── .env.example (commit this)
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── PROJECT.md
├── SETUP.md
├── DATABASE.md
├── API_INTEGRATION.md
├── DESIGN_GUIDELINES.md
├── FEATURES.md
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
├── components/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── utils.ts
│   └── ...
├── types/
│   └── database.ts
├── public/
│   └── fonts/
└── node_modules/
```

---

## Step 16: Git Setup

```bash
# Initialize git repository
git init

# Create .gitignore
echo ".env.local
.env
node_modules/
.next/
out/
dist/
.DS_Store
*.log" > .gitignore

# First commit
git add .
git commit -m "Initial project setup"
```

---

## Troubleshooting

### Issue: Supabase Connection Failed
**Solution**: Check if your API keys are correct and project is fully initialized

### Issue: Shadcn Components Not Styled Correctly
**Solution**: Ensure `components.json` has correct paths and `tailwind.config.ts` includes component paths

### Issue: Fonts Not Loading
**Solution**: Check font file paths and ensure fonts are in `public/fonts/`

### Issue: AssemblyAI API Returns 401
**Solution**: Verify your API key and check if it's properly set in `.env.local`

---

## Next Steps

After completing setup:

1. ✅ Verify all dependencies installed
2. ✅ Check all API connections work
3. ✅ Read `DATABASE.md` and run migrations
4. ✅ Read `API_INTEGRATION.md` for detailed AI/email integration
5. ✅ Read `DESIGN_GUIDELINES.md` for UI implementation
6. ✅ Read `FEATURES.md` for feature-by-feature development guide
7. 🚀 Start building!

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
