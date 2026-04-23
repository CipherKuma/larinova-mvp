-- Subscriptions table
CREATE TABLE IF NOT EXISTS larinova_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doctor_id)
);

-- AI usage tracking table
CREATE TABLE IF NOT EXISTS larinova_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES larinova_doctors(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('summary', 'medical_codes', 'helena_chat')),
  consultation_id UUID REFERENCES larinova_consultations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_larinova_subscriptions_doctor_id ON larinova_subscriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_larinova_subscriptions_razorpay_sub_id ON larinova_subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_larinova_ai_usage_doctor_feature ON larinova_ai_usage(doctor_id, feature);

-- RLS policies
ALTER TABLE larinova_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE larinova_ai_usage ENABLE ROW LEVEL SECURITY;

-- Doctors can read their own subscription
CREATE POLICY "Doctors can view own subscription"
  ON larinova_subscriptions FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

-- Doctors can read their own usage
CREATE POLICY "Doctors can view own usage"
  ON larinova_ai_usage FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM larinova_doctors WHERE user_id = auth.uid()
  ));

-- Service role can manage all (for API routes using service role)
CREATE POLICY "Service role full access subscriptions"
  ON larinova_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access usage"
  ON larinova_ai_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-create free subscription for new doctors
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO larinova_subscriptions (doctor_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_doctor_created_subscription
  AFTER INSERT ON larinova_doctors
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();
