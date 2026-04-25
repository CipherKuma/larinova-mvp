# Apply this migration to production Supabase

The migration file `20260425120000_invite_codes_and_drop_whitelisted.sql`
plus seed inserts must be run against the larinova project
(`qrsdodlbzjghfxoppcsp`).

Claude could not apply this automatically — `SUPABASE_ACCESS_TOKEN` in the
vault is for a different account (only sees `domaid`), and the saved
`marty` Supabase browser session is logged out (probe lies; trust probe
over cookie metadata per `~/.claude/rules/testing-rules.md`).

## Steps

1. Open https://supabase.com/dashboard/project/qrsdodlbzjghfxoppcsp/sql/new
2. Paste the contents of `supabase/migrations/20260425120000_invite_codes_and_drop_whitelisted.sql`
3. Append:

```sql
INSERT INTO larinova_invite_codes (code, note) VALUES
  ('LARINOVA-A7K9', 'Pilot doctor 1'),
  ('LARINOVA-B3M2', 'Pilot doctor 2'),
  ('LARINOVA-C9P4', 'Pilot doctor 3'),
  ('LARINOVA-D1X7', 'Pilot doctor 4'),
  ('LARINOVA-E5Q8', 'Pilot doctor 5')
ON CONFLICT (code) DO NOTHING;

SELECT code, note FROM larinova_invite_codes WHERE redeemed_by IS NULL ORDER BY created_at DESC;
```

4. Run. Expected: 5 rows returned in the final `SELECT`.

## What this does

- Drops `'whitelisted'` from the `larinova_subscriptions.status` enum
- Creates `larinova_invite_codes` table with RLS enabled (no user-facing policies)
- Adds `larinova_doctors.invite_code_redeemed_at` column
- Creates `redeem_invite_code(p_code TEXT)` RPC (SECURITY DEFINER, granted to `authenticated`)
- Seeds 5 pilot codes

## Until this is applied

- New users will see `/redeem` but submitting a code returns 400 (RPC missing).
- Whitelisted-status check constraint persists; already-active users unaffected.
- Existing onboarded doctors are grandfathered (skip `/redeem` entirely) so their UX is unchanged.

After applying, delete this `.READY-TO-APPLY.md` file.
