-- Discovery survey responses table
-- Stores all submissions from the landing page discovery form

CREATE TABLE IF NOT EXISTS larinova_discovery_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'id')),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  clinic TEXT NOT NULL,
  city TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  patients_per_day TEXT,
  data_storage TEXT[] DEFAULT '{}',
  data_storage_other TEXT,
  paperwork_time TEXT,
  shift_notes TEXT,
  referral_time TEXT,
  problems TEXT[] DEFAULT '{}',
  priorities TEXT[] DEFAULT '{}',
  tell_us_more TEXT
);

-- Index for time-series queries on the admin dashboard
CREATE INDEX idx_discovery_surveys_created_at ON larinova_discovery_surveys (created_at DESC);

-- Index for locale filtering
CREATE INDEX idx_discovery_surveys_locale ON larinova_discovery_surveys (locale);
