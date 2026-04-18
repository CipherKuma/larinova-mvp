# Larinova Opener Message Library

Canonical templates for all first-touch and follow-up outreach. Every message Gabriel sends starts from one of these templates.

## How to Use

1. Pick the template matching your **persona × channel × stage** combination — see INDEX.md
2. Fill in all `[PLACEHOLDER]` tokens using Lead Researcher output — see `_shared/placeholders.md`
3. Submit Bahasa templates to **Localization Reviewer agent** before sending
4. Log send event in CRM immediately after sending

## Directory Structure

```
openers/
  README.md           ← you are here
  INDEX.md            ← master table of all templates with IDs and signals
  indonesia/
    solo-doctor/      ← Jakarta, Persona 1 (Dr. Andi)
    clinic-owner/     ← Jakarta, Persona 2 (Dr. Sari)
    hospital-admin/   ← Jakarta metro, Persona 3 (Pak/Bu Direktur)
    ambassador-recruit/ ← both markets, Persona 5
  india/
    tamil-gp/         ← Chennai, Persona 4 (Dr. Ravi)
    clinic-owner/     ← Chennai
    ambassador-recruit/ ← both markets
  _shared/
    placeholders.md   ← all [PLACEHOLDER] tokens + sources
    tone-check.md     ← pre-send checklist
```

## Matrix Coverage

| Region | Persona | Channels Covered |
|---|---|---|
| Indonesia (Jakarta) | Solo Doctor | WA ×4 stages ×2 variants, Email ×2 |
| Indonesia (Jakarta) | Clinic Owner | WA ×3 stages ×2 variants, Email recap ×2 languages |
| Indonesia (Jakarta) | Hospital Admin | LinkedIn ×2 variants + follow-up, Email proposal ×2 languages |
| Indonesia | Ambassador Recruit | LinkedIn ×2 variants + follow-up |
| India (Chennai) | Tamil GP | WA ×3 stages ×2 variants, Phone voicemail |
| India (Chennai) | Clinic Owner | WA first-touch, Email first-touch |
| India | Ambassador Recruit | LinkedIn first-touch + follow-up |

## A/B Testing Logic

Every first-touch stage has 2 variants testing meaningfully different angles:

| Variant | Hook Angle |
|---|---|
| A | Time-saving hook (90 min/day recovered) |
| B | Differentiation hook (language moat or competitor gap) |

Run minimum 50 sends per variant before comparing. Promote winner to default, retire loser at monthly review.

## Standard Sequence — Indonesia Solo Doctor

```
Day 0:   wa-first-touch-A or B
Day 2:   wa-bump-2d-A or B (no response)
Day 5:   wa-pivot-5d-A (still no response — new angle)
          + email-first-touch-A (channel switch)
Day 14:  wa-final-14d (last attempt, clean exit)
```

## Standard Sequence — India Tamil GP

```
Day 0:   wa-first-touch-A or B
Day 2:   wa-bump-2d-A (no response)
         + phone-voicemail (if phone number available)
Day 7:   close and move on
```

## Hard Rules

- Every message: Hook + Proof + Ask. Remove none.
- Every message: at least one specific number.
- No emojis.
- No invented prior connections ("as we discussed", "as I mentioned before").
- Bahasa templates: Localization Reviewer approval before send.
- Send times: 07:00–08:00 or 19:00–20:00 local. Never 09:00–12:00 (clinical hours).
