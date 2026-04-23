# Worker Setup — `scripts/worker.ts`

The Larinova app no longer depends on Inngest. All three AI agents (Intake AI,
Post-consult Dispatcher, Wellness Follow-up) plus Patient Narrative run as
plain async functions invoked by a **polling worker** on your 24/7 Linux box.

## What the worker does

Every 10 seconds it:

1. **Scans `larinova_follow_up_threads`** for rows where `scheduled_for <= now()`,
   `outcome IS NULL`, and `flagged = false`. Each becomes a
   `followup.scheduled` job (worker marks thread `status='scheduled'` to
   avoid re-enqueuing on the next tick).
2. **Polls `larinova_agent_jobs` where `status='pending'`** (up to 10 at a time),
   claims each via compare-and-set update to `status='running'`, dispatches
   to the matching agent based on the `event` column, and marks `done` or
   `failed` (after 3 retries) with a result blob.

Events → agents map:

| `event` column | Handler |
|---|---|
| `intake.submitted`, `intake.info_received` | `intake.run()` |
| `consultation.finalized` | `dispatcher.run()` |
| `followup.scheduled` | `wellness.runSend()` |
| `followup.message_received` | `wellness.runReply()` |
| `narrative.regenerate` | `narrative.run()` |

## Required env (on the Linux box)

Same as the Vercel app:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # REQUIRED — agents write back as admin

CLAUDE_SERVICE_URL=https://claude.fierypools.fun
CLAUDE_SERVICE_API_KEY=...

RESEND_API_KEY=...                   # email is the only live channel for alpha

# MSG91 / GUPSHUP keys are optional — when absent, notify()'s sms/whatsapp
# channels simulate (log + insert larinova_messages with status='simulated').
```

Put them in `app/.env.local` on the box, or export via systemd's
`EnvironmentFile=`.

## Install

```bash
git clone git@github.com:CipherKuma/larinova-mvp.git /opt/larinova
cd /opt/larinova/app
pnpm install
cp /path/to/your/secrets/.env.local .
```

## Run (ad-hoc)

```bash
cd /opt/larinova/app
pnpm tsx scripts/worker.ts
```

Expected output:
```
[worker] started pid=12345 poll=10s
[worker] job <uuid> agent=intake event=intake.submitted
[worker] job <uuid> done (2143ms)
```

## Run under systemd (recommended for production)

Create `/etc/systemd/system/larinova-worker.service`:

```ini
[Unit]
Description=Larinova agent worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=larinova
WorkingDirectory=/opt/larinova/app
EnvironmentFile=/opt/larinova/app/.env.local
ExecStart=/usr/bin/env pnpm tsx scripts/worker.ts
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/larinova/worker.log
StandardError=append:/var/log/larinova/worker.err.log

# Harden
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/log/larinova
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo useradd -r -s /bin/false larinova     # if not already present
sudo mkdir -p /var/log/larinova
sudo chown larinova:larinova /var/log/larinova
sudo systemctl daemon-reload
sudo systemctl enable --now larinova-worker
sudo systemctl status larinova-worker
sudo tail -f /var/log/larinova/worker.log
```

## Updating to latest code

```bash
cd /opt/larinova
git pull
cd app
pnpm install
sudo systemctl restart larinova-worker
```

## Observability

Quick status checks:

```bash
# How many jobs pending / failed?
psql "$DATABASE_URL" -c "
  SELECT status, COUNT(*) FROM larinova_agent_jobs
  GROUP BY status ORDER BY status;
"

# Recent failures
psql "$DATABASE_URL" -c "
  SELECT id, event, error, attempts, completed_at
  FROM larinova_agent_jobs WHERE status='failed'
  ORDER BY completed_at DESC LIMIT 10;
"

# Due-but-not-yet-dispatched follow-ups
psql "$DATABASE_URL" -c "
  SELECT id, tier, scheduled_for, status FROM larinova_follow_up_threads
  WHERE scheduled_for <= now() AND outcome IS NULL AND flagged = false
  ORDER BY scheduled_for ASC LIMIT 10;
"
```

## Failure model

- Retries: default 3 per job. Set by `MAX_ATTEMPTS` in `worker.ts`.
- Terminal failures stay in `status='failed'` with `error` populated — review
  and manually requeue if you want (`UPDATE ... SET status='pending',
  attempts=0 WHERE id=...`).
- Graceful shutdown on SIGINT / SIGTERM: worker finishes the current tick
  then exits. Systemd restart cycles naturally.

## Scaling

One worker is plenty for alpha (5 pilot doctors). If you ever need more:
`UPDATE ... SET status='running' WHERE id=... AND status='pending'` is atomic
in Postgres so multiple workers can run side by side without double-dispatch.
Just run the same service on another machine with the same env.
