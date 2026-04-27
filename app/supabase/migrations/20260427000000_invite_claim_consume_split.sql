-- ============================================================================
-- Split invite-code lifecycle into CLAIM (sign-in) + CONSUME (onboarding done)
--
-- Existing model:  redeemed_at + redeemed_by  → set at single point, code locked
-- New model:
--   claimed_at + claimed_by_user_id → set when user enters the code at /access
--                                     and authenticates. Code is "in flight".
--   consumed_at                      → set only when onboarding completes.
--                                     Code is permanently used.
--   redeemed_at + redeemed_by remain as back-compat (kept in sync).
--
-- Behaviour:
--   - A code is fully USED when consumed_at IS NOT NULL → cannot be claimed again.
--   - A code that's claimed but not consumed is locked to the claimant for 7 days
--     (CLAIM_TTL). After that, the claim auto-expires and the code is available
--     for someone else.
-- ============================================================================

-- 1. New columns (additive, nullable)
ALTER TABLE larinova_invite_codes
  ADD COLUMN IF NOT EXISTS claimed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consumed_at         TIMESTAMPTZ;

-- 1a. Doctor row gains a claim signal (separate from invite_code_redeemed_at,
--     which now means "consumed / fully used"). The proxy uses this to
--     decide whether an authed user has cleared the access gate.
ALTER TABLE larinova_doctors
  ADD COLUMN IF NOT EXISTS invite_code_claimed_at TIMESTAMPTZ;

-- Backfill: anyone with a redeemed timestamp on the doctor row is also
-- considered "claimed" at the same time, so they don't get bounced.
UPDATE larinova_doctors
   SET invite_code_claimed_at = invite_code_redeemed_at
 WHERE invite_code_redeemed_at IS NOT NULL
   AND invite_code_claimed_at IS NULL;

-- 2. Backfill for existing redeemed rows: existing redemptions are treated as
--    fully consumed (those doctors are already onboarded).
UPDATE larinova_invite_codes
   SET claimed_at         = COALESCE(claimed_at, redeemed_at),
       claimed_by_user_id = COALESCE(claimed_by_user_id, redeemed_by),
       consumed_at        = COALESCE(consumed_at, redeemed_at)
 WHERE redeemed_at IS NOT NULL;

-- 3. Consistency constraint: consumed → must have been claimed first
ALTER TABLE larinova_invite_codes
  DROP CONSTRAINT IF EXISTS consumed_requires_claim;
ALTER TABLE larinova_invite_codes
  ADD CONSTRAINT consumed_requires_claim
    CHECK (consumed_at IS NULL OR claimed_at IS NOT NULL);

-- 4. Index for claim lookups
CREATE INDEX IF NOT EXISTS idx_larinova_invite_codes_claimed_by
  ON larinova_invite_codes (claimed_by_user_id)
  WHERE claimed_by_user_id IS NOT NULL;

-- 5. CLAIM RPC. Caller must be authenticated. Idempotent for the same user.
CREATE OR REPLACE FUNCTION claim_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_claim_ttl  INTERVAL := INTERVAL '7 days';
  v_row        larinova_invite_codes%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the row for the duration of this transaction
  SELECT * INTO v_row
    FROM larinova_invite_codes
   WHERE code = p_code
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  -- Permanent lock once consumed
  IF v_row.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  -- Idempotent claim by the same user
  IF v_row.claimed_by_user_id = v_user_id THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true);
  END IF;

  -- In-flight claim by a different user — allow takeover only if expired
  IF v_row.claimed_by_user_id IS NOT NULL
     AND v_row.claimed_at > (v_now - v_claim_ttl) THEN
    RAISE EXCEPTION 'invalid_or_used_code' USING ERRCODE = 'P0001';
  END IF;

  UPDATE larinova_invite_codes
     SET claimed_at         = v_now,
         claimed_by_user_id = v_user_id,
         -- back-compat: keep redeemed_* mirrored to claim
         redeemed_at        = v_now,
         redeemed_by        = v_user_id
   WHERE code = p_code;

  -- Mirror onto the doctor row so the proxy can gate without an extra query
  UPDATE larinova_doctors
     SET invite_code_claimed_at = v_now
   WHERE user_id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'already_claimed', false);
END;
$$;

REVOKE ALL ON FUNCTION claim_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_invite_code(TEXT) TO authenticated;

-- 6. PRE-AUTH validation. Returns whether a code is currently AVAILABLE to be
--    claimed. Does NOT mutate state. Safe to call without auth.
CREATE OR REPLACE FUNCTION validate_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now        TIMESTAMPTZ := NOW();
  v_claim_ttl  INTERVAL := INTERVAL '7 days';
  v_row        larinova_invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row
    FROM larinova_invite_codes
   WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_used_code');
  END IF;

  IF v_row.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_used_code');
  END IF;

  IF v_row.claimed_by_user_id IS NOT NULL
     AND v_row.claimed_at > (v_now - v_claim_ttl) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_used_code');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION validate_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_invite_code(TEXT) TO anon, authenticated;

-- 7. CONSUME RPC. Called when onboarding completes. Marks the code permanently
--    used and flips onboarding_completed atomically.
CREATE OR REPLACE FUNCTION consume_invite_code()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := NOW() + INTERVAL '30 days';
  v_row        larinova_invite_codes%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  -- Find the code claimed by this user, lock it
  SELECT * INTO v_row
    FROM larinova_invite_codes
   WHERE claimed_by_user_id = v_user_id
     AND consumed_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    -- Already consumed? Idempotent success.
    PERFORM 1 FROM larinova_invite_codes
      WHERE claimed_by_user_id = v_user_id
        AND consumed_at IS NOT NULL;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'already_consumed', true,
                                'period_end', v_period_end);
    END IF;
    RAISE EXCEPTION 'no_active_claim' USING ERRCODE = 'P0001';
  END IF;

  UPDATE larinova_invite_codes
     SET consumed_at = v_now
   WHERE code = v_row.code;

  -- Sync the doctor row: invite_code_redeemed_at + onboarding_completed
  UPDATE larinova_doctors
     SET invite_code_redeemed_at = v_now,
         onboarding_completed    = TRUE
   WHERE user_id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'already_consumed', false,
                            'period_end', v_period_end);
END;
$$;

REVOKE ALL ON FUNCTION consume_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_invite_code() TO authenticated;

-- 8. Note: redeem_invite_code() (the legacy single-step RPC) is left in place
--    for back-compat with existing /redeem flow; new flow does not call it.
