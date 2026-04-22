-- Razorpay customer id on subscription row (nullable; populated on first Checkout).
ALTER TABLE larinova_subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_larinova_subscriptions_razorpay_customer_id
  ON larinova_subscriptions(razorpay_customer_id);

-- Idempotency log for Razorpay webhook events.
-- The payment/subscription/event pair is our dedupe key; Razorpay retries and
-- we must not process the same event twice.
CREATE TABLE IF NOT EXISTS larinova_razorpay_events (
  id TEXT PRIMARY KEY,                  -- Razorpay event id (x-razorpay-event-id header, or payload.id)
  event TEXT NOT NULL,                  -- e.g. subscription.activated
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_larinova_razorpay_events_sub
  ON larinova_razorpay_events(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_larinova_razorpay_events_event
  ON larinova_razorpay_events(event);

ALTER TABLE larinova_razorpay_events ENABLE ROW LEVEL SECURITY;

-- Service role only; no doctor/patient should read the raw event log.
CREATE POLICY "Service role full access razorpay_events"
  ON larinova_razorpay_events FOR ALL
  USING (true)
  WITH CHECK (true);
