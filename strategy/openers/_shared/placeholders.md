# Placeholder Tokens

All `[PLACEHOLDER]` tokens used across the opener library. The Lead Researcher agent fills these before Gabriel reviews and sends.

---

## Universal Tokens

| Token | Description | Source |
|---|---|---|
| `[Nama Dokter]` | Doctor's full name or preferred name | IDI directory, clinic website, LinkedIn |
| `[Name]` | (English templates) First name or "Dr. Surname" | LinkedIn, clinic website |
| `[Hook Personalisasi]` | 1-sentence personalization — WHY this specific person | See Hook Sources below |
| `[Personalization Hook]` | (English templates) Same as above | See Hook Sources below |
| `[APP LINK]` | https://app.larinova.com | Fixed — never changes |

---

## Indonesia-Specific Tokens

| Token | Description | Source |
|---|---|---|
| `[Klinik]` | Name of doctor's clinic or hospital | Google Maps, clinic website |
| `[Spesialisasi]` | Medical specialty | IDI directory, Google Maps listing |
| `[Jumlah Dokter]` | Number of doctors at the clinic | Clinic website, in-person visit |
| `[X] juta` | Monthly ROI estimate | Formula: jumlah dokter × Rp 6.000.000 |
| `[Nama RS]` | Hospital name | Hospital website |
| `[Nama Direktur]` | Director's full name and title | Hospital website, LinkedIn |
| `[Tipe RS]` | Hospital tier (Tipe A/B/C) | Ministry of Health data |

---

## India-Specific Tokens

| Token | Description | Source |
|---|---|---|
| `[Clinic Name]` | Name of clinic or hospital | Google Maps, Practo listing |
| `[number]` | Number of doctors at clinic | Clinic website |
| `[monthly ROI]` | Monthly value estimate | Formula: number × ₹15,000 |

---

## Hook Sources (for `[Hook Personalisasi]` / `[Personalization Hook]`)

Good hook sources in priority order:

1. **Referral** — "Saya dapat nomor Dokter dari [nama kolega]" / "Your colleague Dr. [X] suggested I reach out"
2. **Public profile** — "Saya lihat profil Dokter di IDI Jakarta sebagai [spesialisasi]"
3. **Google Maps** — "Saya menemukan Klinik [nama] di Google — terlihat aktif melayani pasien di [area]"
4. **LinkedIn** — "I saw your work at [hospital] on LinkedIn"
5. **Event/association** — "Saya lihat Dokter hadir di seminar [nama event] bulan lalu"
6. **Content** — "I came across your post about [topic] on LinkedIn"

Avoid:
- Generic hooks: "Saya menemukan nomor Dokter" (no hook)
- Invented context: "Seperti yang kita diskusikan" (fabricated)
- Overreach: "Saya tahu Dokter sedang mencari solusi" (presumptuous)

---

## ROI Calculation Reference

### Indonesia (per doctor)
- Time saved: 90 min/day × 22 working days = 33 hr/month
- Doctor hourly rate (conservative): Rp 200.000/hr
- Monthly value: Rp 6.600.000 → round to **Rp 6 juta**
- Larinova Pro: Rp 650.000/bulan
- Net ROI: ~Rp 5.35 juta/bulan (~8x return)

### India (per doctor)
- Time saved: 90 min/day × 22 working days = 33 hr/month
- Doctor hourly rate (conservative): ₹500/hr
- Monthly value: ₹16.500 → round to **₹15.000**
- Larinova Pro: ₹1.299/month
- Net ROI: ~₹13.700/month (~10x return)

### Indonesia clinic calculation
- [X] juta = number of doctors × 6 (in millions of Rupiah)
- Example: 5-doctor clinic → Rp 30 juta/bulan recoverable value
