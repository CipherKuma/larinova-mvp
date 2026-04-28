-- ============================================================================
-- Invite-claimed doctors are pro for 30 days, not free.
--
-- Bug: claim_invite_code() and consume_invite_code() updated the doctor row
-- but never touched larinova_subscriptions, so every invite-redeemed doctor
-- stayed on the default plan='free' row created by the on_doctor_created
-- trigger. This contradicts the launch offer ("1 month free, full access").
--
-- Fix: when a doctor claims a valid invite code, also flip their existing
-- subscription row to plan='pro', status='active',
-- current_period_end = NOW() + 30 days.
--
-- Pro is granted at CLAIM (not consume) so the doctor has full features
-- during onboarding, not gated until onboarding completes.
--
-- Guarded with `WHERE plan = 'free'` so paying-pro doctors are never
-- downgraded by an invite re-claim.
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_now        TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := NOW() + INTERVAL '30 days';
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
         redeemed_at        = v_now,
         redeemed_by        = v_user_id
   WHERE code = p_code;

  -- Mirror onto the doctor row so the proxy can gate without an extra query
  UPDATE larinova_doctors
     SET invite_code_claimed_at = v_now
   WHERE user_id = v_user_id;

  -- Grant pro for 30 days. The on_doctor_created trigger already inserted a
  -- plan='free' row for this doctor; flip it to pro. Guarded so a paying-pro
  -- subscription is never overwritten by an invite re-claim.
  UPDATE larinova_subscriptions s
     SET plan               = 'pro',
         status             = 'active',
         current_period_end = v_period_end,
         updated_at         = v_now
    FROM larinova_doctors d
   WHERE s.doctor_id = d.id
     AND d.user_id   = v_user_id
     AND s.plan      = 'free';

  RETURN jsonb_build_object('ok', true, 'already_claimed', false);
END;
$$;

REVOKE ALL ON FUNCTION claim_invite_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_invite_code(TEXT) TO authenticated;

-- ============================================================================
-- Backfill: doctors who already claimed an invite code but were stuck on
-- plan='free' get upgraded to pro for 30 days from their claim date. This
-- mirrors what the production data fix did manually for Balachandar Seeman
-- and Gabriel Antony Xaviour on 2026-04-28; idempotent for replay on staging.
-- ============================================================================
UPDATE larinova_subscriptions s
   SET plan               = 'pro',
       status             = 'active',
       current_period_end = d.invite_code_claimed_at + INTERVAL '30 days',
       updated_at         = NOW()
  FROM larinova_doctors d
 WHERE s.doctor_id              = d.id
   AND d.invite_code_claimed_at IS NOT NULL
   AND s.plan                   = 'free';
