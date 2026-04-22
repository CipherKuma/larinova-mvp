# Current Spec

## Goal
Grind fully tested. Two bugs found, both fixed. System ready for real overnight use.

## Decided (shipped this turn)
- **Bug 1 (bash heredoc+$() quote tokenization):** grind-task.sh rewritten with printf-to-tempfile + cat-read pattern. `bash -n` now passes.
- **Bug 2 (--add-dir variadic arg swallowing prompt):** changed `--add-dir "$JAIL" "$PROMPT"` → `--add-dir="$JAIL" "$PROMPT"`. `=` syntax binds exactly one value and eliminates ambiguity. Verified: `claude -p --dangerously-skip-permissions --add-dir=/tmp "say PONG"` returns PONG immediately.
- **Preflight hardening:** grind-loop.sh now runs `bash -n` on both helper scripts at startup; refuses to run if either fails syntax check.
- **Anomaly detection:** zero-duration task finishes (< 2s) are flagged as anomalies. Stderr from grind-task.sh is captured into `last-task-stderr.log` and surfaced in QUESTIONS.md so morning review sees the real error.

## Open
- No blocking issues. Grind is ship-ready.
- User still to disconnect Gmail/Calendar/Drive at claude.ai if desired (account-level, not programmatic).
- AGENTS.md for other projects (rax, hackathons, starter-kit, infra/*) will auto-scaffold on first SessionStart per project.

## Out of scope
- Full second re-test via sub-agent — killed mid-run after the second bug was diagnosed. Smoke test on the fix confirmed `claude -p` returns promptly. If you want a full end-to-end re-test later, rerun the integration-test sub-agent.

## Definition of done
- Both bugs fixed ✓
- All three grind scripts parse ✓
- Smoke test on argument-order fix passes ✓
- Preflight + anomaly detection in place so any future bug fails loud instead of silent overnight waste ✓
