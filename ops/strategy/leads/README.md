# Larinova Lead Intake Templates

Two CSV files — one per market. Paste raw leads here. The Lead Researcher agent enriches them into
the CRM-ready format (see `strategy/crm/crm-template.csv`).

---

## How to Use

Paste raw leads into the appropriate file. One row per lead. Do not worry about formatting — the
Lead Researcher agent will clean up names, verify spellings, and add enrichment. The only required
fields to make a row useful are: `raw_name` + `city` + at least one contact method (`phone`,
`whatsapp`, or `email`). Everything else is optional but helpful.

**City is pre-set per file:**
- `jakarta-intake-template.csv` — all rows are Jakarta leads. Always enter `Jakarta` in the `city`
  column.
- `chennai-intake-template.csv` — all rows are Chennai leads. Always enter `Chennai` in the `city`
  column.

Do not mix markets in a single file.

---

## Column Reference

| Column | Required | Notes |
|---|---|---|
| `raw_name` | Yes | Any format — `Dr. Andi`, `Andi Pratama MD`, `bu Sari`, `Sari` are all fine. |
| `clinic_or_hospital` | No | Clinic or hospital name, or `Unknown` if not known. |
| `city` | Yes | Pre-set: `Jakarta` for Jakarta file, `Chennai` for Chennai file. |
| `specialty` | No | GP, pediatrics, OB-GYN, etc. Leave blank if unknown — agent will infer. |
| `phone` | Conditional | At least one of phone, whatsapp, or email required. Any format OK. |
| `whatsapp` | Conditional | Only if different from phone number. |
| `email` | Conditional | |
| `linkedin_url` | No | Full URL. Helps the agent find enrichment data. |
| `source` | No | How Gabriel found this lead. E.g. `WhatsApp contact`, `LinkedIn search`, `Medical assoc list`, `Personal network`, `IDI conference`. |
| `warmth` | No | `cold` / `warm` / `referred`. Default to `cold` if unsure. |
| `referral_from` | No | Name of person who referred, if `warmth = referred`. |
| `notes` | No | Anything Gabriel knows — context, meeting notes, prior relationship. E.g. `met at IDI conf Apr 2026`, `cousin's doctor`, `replied to LinkedIn post about SATUSEHAT`. |

---

## Examples

Three rows showing different completeness levels:

### Minimum viable row (just a name + city + phone)
```csv
raw_name,clinic_or_hospital,city,specialty,phone,whatsapp,email,linkedin_url,source,warmth,referral_from,notes
Dr. Andi,Unknown,Jakarta,,+62 812 9876 5432,,,, WhatsApp contact,cold,,
```

### Medium row (name + clinic + contact + source + notes)
```csv
raw_name,clinic_or_hospital,city,specialty,phone,whatsapp,email,linkedin_url,source,warmth,referral_from,notes
Dr. Sari Dewi,Klinik Pratama Kelapa Gading,Jakarta,Pediatrics,+62 811 2222 3333,,sari@kliniksari.co.id,,LinkedIn search Jakarta pediatricians,cold,,Active on LinkedIn — posted about SATUSEHAT deadline last month
```

### Full row (warm referred lead with all context)
```csv
raw_name,clinic_or_hospital,city,specialty,phone,whatsapp,email,linkedin_url,source,warmth,referral_from,notes
bu Rahma Putri,RS Harapan Bunda,Jakarta,OB-GYN,+62 819 5555 6666,+62 819 5555 6666,rahma@rshb.id,https://linkedin.com/in/rahmaputri,Personal network,referred,Dr. Budi Santoso,Met Budi at IDI conf Apr 2026 — he uses the product and vouched for us. Rahma runs the OB dept at RS Harapan Bunda (120 beds). Call after 13:00 WIB.
```

---

## Lead Researcher Invocation

Once you have a batch of rows ready, paste them into the Lead Researcher invocation prompt in
`strategy/AGENT_WORKFORCE.md §1`. The agent outputs a markdown table with:

- Verified name and clinic
- Practice type, specialty, clinic size estimate
- Persona match (from GO_TO_MARKET.md §3)
- Priority score 1–5
- 2–3 personalization hooks for message drafting

Paste the enriched output into `strategy/crm/crm-template.csv` as new rows, then advance each lead
from stage `new` to `enriched`.
