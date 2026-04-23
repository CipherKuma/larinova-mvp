# Larinova CRM — Column Reference & Operations Guide

This CSV is the single source of truth for every lead interaction. Import `crm-template.csv` into
Google Sheets. One row per lead; add interaction history via the `last_touch_*` fields after each
conversation. The CRM Logger agent appends structured rows from free-text call notes.

---

## Column Reference

| Column | Type | Notes |
|---|---|---|
| `lead_id` | string | Auto-incremented. Format: `IDN-001` (Indonesia), `IND-001` (India). Never reuse a deleted ID. |
| `date_added` | YYYY-MM-DD | Date the lead entered the pipeline. |
| `name` | string | Full name with title — e.g. `Dr. Andi Pratama`. |
| `clinic_name` | string | Clinic or hospital name. Use `Solo Practice` if no clinic name. |
| `city` | string | Jakarta or Chennai for in-scope leads. Flag anything else as `[OUT-OF-SCOPE]` — do not actively work these until Day 90 review. |
| `country` | IDN / IND | Two values only. |
| `specialty` | string | GP, Pediatrics, OB-GYN, Cardiology, Dermatology, Orthopedics, Internal Medicine, Psychiatry, Other. |
| `practice_size` | enum | `solo` / `2–3` / `4–10` / `11–30` / `30+`. Estimate from clinic name if unknown. |
| `persona` | enum | `solo-doctor` / `clinic-owner` / `hospital-admin` / `ambassador-recruit`. Matches GO_TO_MARKET.md §4. |
| `priority_score` | 1–5 | Set by Lead Researcher agent. 5 = highest ICP fit + most reachable. |
| `phone` | string | Include country code. E.g. `+62 812 3456 7890`. |
| `whatsapp` | string | If different from phone; else leave blank. |
| `email` | string | |
| `linkedin` | string | Full URL. |
| `source` | string | How this lead entered. E.g. `Gabriel personal network Chennai`, `Indonesia medical assoc list`, `LinkedIn search Jakarta pediatricians`. |
| `personalization_hooks` | string | Pipe-separated facts for message drafting. E.g. `practicing since 2011\|Kelapa Gading location\|pediatric specialist`. From Lead Researcher. |
| `stage` | enum | See stage lifecycle below. |
| `last_touch_date` | YYYY-MM-DD | Date of most recent outreach or conversation. |
| `last_touch_channel` | enum | `wa` / `linkedin` / `email` / `phone` / `in-person`. |
| `last_touch_summary` | string | Max 200 chars. What happened — e.g. `Replied interested, asked about BPJS integration, demo booked for Fri`. |
| `next_action` | string | One specific thing to do next — e.g. `Send demo link`, `Follow up after 3 days`, `Prepare proposal`. |
| `next_touch_date` | YYYY-MM-DD | When to take the next action. Follow-up Sequencer scans this field daily. |
| `sentiment` | enum | `positive` / `neutral` / `negative` / `blocked`. Blocked = unresponsive 14+ days or explicitly said no. |
| `ab_variant_seen` | string | Which message variant this lead received first. E.g. `id-solo-doctor-wa-first-touch-A`. |
| `objection_type` | enum | `price` / `language` / `compliance` / `feature` / `timing` / `trust` / `other` / `none`. Use `none` if no objection raised yet. |
| `competitor_mentioned` | string | Any competitor the lead named. E.g. `Eka.Care`, `SAFFMedic`, `HealthPlix`, `Medify`, `SIKDA Optima`. Leave blank if none. |
| `notes` | string | Free text. Everything that doesn't fit the structured fields — meeting notes, context, personal details to remember. |

---

## Stage Lifecycle

```
new → enriched → first-touched → qualified → demo-booked → demo-done → signed-up → activated → paid
                                                                                              ↓
                                                                                           churn → archived
```

| Stage | Meaning |
|---|---|
| `new` | Just added; no enrichment yet |
| `enriched` | Lead Researcher has run; priority score + hooks filled |
| `first-touched` | Gabriel sent first outreach message |
| `qualified` | Lead replied and confirmed interest / pain fit |
| `demo-booked` | Demo call scheduled |
| `demo-done` | Demo completed |
| `signed-up` | Account created at app.larinova.com |
| `activated` | Used the product at least once (ran a transcription) |
| `paid` | On a paid plan |
| `churn` | Cancelled or went silent after activation |
| `archived` | Not pursuing further — out-of-scope city, no response after 3 touches, explicit no |

---

## How the CRM Logger Agent Maps Notes to This Schema

The CRM Logger receives a free-text call or conversation summary and outputs a structured row
update. Mapping rules:

- **Sentiment**: inferred from tone — mentions of interest / demo request → `positive`; no reply
  after 2 touches → `neutral`; explicit objection or unresponsive after 3 touches → `negative` or
  `blocked`
- **Stage**: advanced by the most recent event — if the summary mentions "booked a call" →
  `demo-booked`; "created account" → `signed-up`
- **Objection**: extracted from any concern raised — "too expensive" → `price`; "does it work in
  Bahasa?" → `language`; "waiting for budget" → `timing`
- **Competitor**: extracted from direct mentions in the conversation
- **last_touch_summary**: condensed to 200 chars max, preserving the most decision-relevant detail
- **next_action** and **next_touch_date**: inferred from conversation — if demo booked, next action
  is `Prep demo` and date is the booked date; if no response, next action is `Follow up` and date
  is today + 2

To invoke the CRM Logger, paste the conversation transcript or notes and the current row state into
the agent prompt in `AGENT_WORKFORCE.md §4`.

---

## Manual Row Updates

After any conversation:

1. Update `last_touch_date` to today.
2. Update `last_touch_channel` to how you reached them.
3. Write a 1–2 sentence `last_touch_summary`.
4. Advance `stage` if something changed.
5. Set `next_action` and `next_touch_date`.
6. Update `sentiment` if it shifted.
7. Log any `objection_type` or `competitor_mentioned`.

Do this within 30 minutes of the conversation. After 24 hours, detail accuracy drops sharply.

---

## Daily Hygiene (5 minutes, every morning)

1. Open the CRM, filter by `next_touch_date = today`.
2. For each lead due: complete the action, then update the row.
3. Scan for `sentiment = blocked` — decide: archive or try a different channel.
4. Scan for `stage = demo-done` with no `stage` advance for 3+ days — these are stalling. Push them.
5. Check `next_touch_date` blanks — every active lead must have a next touch date. No blanks in
   the active pipeline.
