-- ============================================================================
-- Invite-code access system + drop whitelisted enum value
-- Spec: docs/superpowers/specs/2026-04-25-invite-code-system-design.md
-- Plan: docs/superpowers/plans/2026-04-25-invite-code-system.md
-- ============================================================================

-- 1. Drop "whitelisted" from larinova_subscriptions.status enum
ALTER TABLE larinova_subscriptions
  DROP CONSTRAINT IF EXISTS larinova_subscriptions_status_check;
ALTER TABLE larinova_subscriptions
  ADD CONSTRAINT larinova_subscriptions_status_check
    CHECK (status IN ('active','canceled','past_due','trialing'));

-- Defensive: downgrade any whitelisted rows to active (expected count: 0).
UPDATE larinova_subscriptions SET status = 'active' WHERE status = 'whitelisted';

-- 2. Invite codes table
CREATE TABLE IF NOT EXISTS larinova_invite_codes (
  code         TEXT PRIMARY KEY,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at  TIMESTAMPTZ,
  CONSTRAINT redeemed_pair_consistent
    CHECK ((redeemed_by IS NULL) = (redeemed_at IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_larinova_invite_codes_redeemed_by
  ON larinova_invite_codes (redeemed_by) WHERE redeemed_by IS NOT NULL;

ALTER TABLE larinova_invite_codes ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. The redeem_invite_code RPC (SECURITY DEFINER)
-- is the only path that touches this table from the app.

-- 3. Doctor row gains the gate signal
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS invite_code_redeemed_at TIMESTAMPTZ;

-- 4. Atomic redemption RPC. Uses auth.uid() — never trusts client-supplied
-- user ids. SECURITY DEFINER so it can write to tables RLS would otherwise
-- block, but the identity it acts on is always the caller's auth.uid().
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := v_now + INTERVAL '30 days';
  v_already    TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotency: if this user already redeemed any code, succeed silently.
  SELECT invite_code_redeemed_at INTO v_already
    FROM larinova_doctors WHERE user_id = v_user_id;
  IF v_already IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_redeemed', true);
  END IF;

  -- Lock the code row, fail if missing or used.
  PERFORM 1 FROM larinova_invite_codes
   WHERE code = p_code AND redeemed_by IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  UPDATE larinova_invite_codes
     SET redeemed_by = v_user_id, redeemed_at = v_now
   WHERE code = p_code;

  UPDATE larinova_doctors
     SET invite_code_redeemed_at = v_now
   WHERE user_id = v_user_id;

  -- Upsert subscription: 30 days of Pro. GREATEST() never shortens
  -- access if a longer period_end already exists.
  INSERT INTO larinova_subscriptions (doctor_id, plan, status, current_period_end)
  SELECT id, 'pro', 'active', v_period_end
    FROM larinova_doctors WHERE user_id = v_user_id
  ON CONFLICT (doctor_id) DO UPDATE
    SET plan = 'pro',
        status = 'active',
        current_period_end = GREATEST(
          larinova_subscriptions.current_period_end,
          EXCLUDED.current_period_end
        );

  RETURN jsonb_build_object('ok', true, 'period_end', v_period_end);
END;
$$;

REVOKE ALL ON FUNCTION redeem_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_invite_code(TEXT) TO authenticated;
