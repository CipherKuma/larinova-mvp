# Sigda Optima — Complete Form Specification

> Extracted from 119 video frames of the Elisa Erlanda demo call (13 April 2026).
> Source platform: Sigda Optima (sikda-optima.com) — PT Teknokayo International © 2015
> Facility: PUSKESMAS SETIA BUDI

This document is the source of truth for building Larinova's clinical forms. Every field listed here was visually confirmed from the screen recording.

---

## System Overview

**Modules (Poli) visible in the recording:**
| Poli | Purpose |
|------|---------|
| Poli KI Hamil | Antenatal Care (ANC) |
| Poli Bersalin | Labor & Delivery |
| Poli Nifas | Postpartum |
| Poli MTBM | Manajemen Terpadu Bayi Muda (Neonatal/Infant Assessment) |
| Poli Imunisasi | Immunization |
| Poli Pelayanan 24 Jam | 24-Hour Emergency Service |
| Others (not shown) | GIGI, KB, PKMR, TBC, Lansia, Jiwa, Akupressure |

**Login roles:** Dokter / Perawat / Dokter dan Perawat

**Bottom navigation tabs (universal across all poli):**
`Pasien | Form | Periksa Fisik | CPPT | Diagnosis | Obat | Order Lab | Rujukan | Tindakan | Kelainan | Alergi | Diagnostik | Lokalia | Kamar | Stj Tdk`

---

## 1. Patient Record Header (Universal)

Appears at the top of every patient screen across all poli. Read-only display with edit capability on Rekam Medis.

| Field | Type | Notes |
|-------|------|-------|
| Rekam Medis | Text + edit icon | Medical record number, persistent across visits |
| Telepon/HP (Whatsapp) | Two phone fields | Regular phone + WhatsApp |
| Nama Pasien | Text (read-only) | |
| Jenis Pasien | Text (read-only) | Insurance type code (NONPBI/PSI/TU/GR) + facility |
| Gol. Darah / Nik | Text (read-only) | Blood type + NIK national ID |
| Kelamin / Umur | Text (read-only) | Auto-calculated from DOB |
| Alergi | Text | Allergy notes |
| No Register Poli (Manual) | Text input | Manual registration number |
| Status WS | Label | Status indicator |

**Action buttons:** `Edit` | `Hid` | `Status` | `Keluarga` | `History` | `i-Care` | `Print`

**Patient list view columns:** Urut | Nama | Alamat | Action  
**Patient list search:** Cari No., Cari Nama Pasien, date picker, Reset  
**Tag badges on patient rows (service completion indicators):** Nifas, CPPT, Diagnosis, Obat, Order Lab, Tindakan, Pemeriksaan Fisik, Analisa Makanan, Laktasi/Edukasi, Asuhan Perawat, Imunisasi, Screening Ibu, Screening KB, Screening Anak/Bayi

---

## 2. Form Ibu Hamil (Antenatal Care / ANC)

**Tab:** Form → select "KI Hamil" form

### 2a. Intake Fields

| Field | Type | Options / Notes |
|-------|------|-----------------|
| Cara Masuk | Radio / select | Atas Permintaan Sendiri, Rujukan Dokter, Rujukan Bidan, Rujukan Dukun, Rujukan Polindes, Rujukan Pustu, Rujukan Puskesmas, Rujukan Rumah Bersalin, Rujukan RS, Ibu dan Anak |
| Trimester Ke | Number input | 1, 2, 3 (note: form shows hint "1,2,3,4" but 3 is correct) |
| Kunjungan Ke | Text/select | K1 Murni, K1 Akses, K1, K1+, K2, K3, K4, K5, K6 |

### 2b. Physical Measurements

| Field | Type | Options / Notes |
|-------|------|-----------------|
| Lingkar Lengan Atas (LILA) | Number (cm) | Upper arm circumference — screens for KEK (malnutrition) |
| Status Gizi | Text/select | KEK, Normal |
| TFU (Tinggi Fundus Uteri) | Number (cm) | Uterine fundal height |
| Tinggi Fundus | Number (cm) | May be same as TFU or separate sub-measurement |
| Refleks Patela | Text/select | Positif (+), Negatif (-) |
| Letak Janin | Text | Fetal presentation/position |

### 2c. Gestational Age Calculation

| Field | Type | Notes |
|-------|------|-------|
| HPHT (Hari Pertama Haid Terakhir) | Date picker | Last menstrual period — used to calculate HPL |
| HPL (Hari Perkiraan Lahir) | Date picker | Estimated due date — auto-calculated from HPHT |
| Masukkan Siklus Haid (hari) | Number spinner | Default 28 days; used to adjust HPL calculation |
| Umur Kehamilan (minggu) | Number (auto-calc) | Gestational age in weeks, derived from HPHT |

### 2d. Lab / Clinical Investigations

| Field | Type | Options / Notes |
|-------|------|-----------------|
| Anemia | Text/select | Positif (+), Negatif (-) |
| Golongan Darah | Text/select | A, AB, O, B |
| Urine Protein | Text/select | Positif (+), Negatif (-) |
| Gula Darah Sewaktu (mg/dl) | Number | Random blood glucose |
| GDP (Gula Darah Puasa) | Number | Fasting blood glucose |
| GDP2PP | Number | 2-hour post-prandial blood glucose |

---

## 3. CPPT — Catatan Perkembangan Pasien Terintegrasi (SOAP Note)

**Tab:** CPPT  
**Used in all poli.** This is the core clinical documentation — the primary target for Larinova's AI voice-to-SOAP generation.

### Entry Form Fields

| Field | Type | Notes |
|-------|------|-------|
| Jam Input | Date-time picker | When the note was entered |
| S — Subject | Multiline text | Patient's complaint in clinician's words |
| O — Object (Pemeriksaan Fisik) | Multiline text | Physical exam findings; "Fisik" button to populate from Periksa Fisik tab |
| A — Assessment | Multiline text | Clinical diagnosis (e.g. G1P0A0 hamil 36 minggu dengan JTHI presentasi kepala) |
| P — Planning | Multiline text | Management plan, counseling, follow-up |
| Edukasi Dokter | Text | Patient education given |
| Riwayat Penyakit | Text | Medical history |
| Pengkajian Nyeri | Scale 0–10 | Pain assessment widget with emoji faces: 0=No Pain, 1-3=Mild, 4-6=Moderate, 7-9=Severe/Very Severe, 10=Worst Pain Possible |

### Real CPPT Examples Captured

**Poli KI Hamil (ANC):**
- S: Pasien datang untuk periksa ANC, keluhan nyeri vagina
- O: ku baik, ttv dbn, tfu 28, djj 142, preskep BM PAP
- A: G1P0A0 hamil 36 minggu dengan JTHI presentasi kepala
- P: Memberitahukan hasil pemeriksaan; Konseling tanda bahaya kehamilan TM3; Konseling tanda Persalinan; Konseling persiapan persalinan kembali 1 minggu lagi jika tidak ada keluhan
- Edukasi: Senam Hamil sabtu jam 10.00

**Poli KI Hamil (ANC) — prior visit:**
- S: px pasien mengatakan sudah mulai terasa mulas
- O: ku baik, ttv dbn, tfu 30 cm, djj 148 s/m, sudah masuk PAP
- A: G2P1A0 hamil 39 minggu dengan JTHI presentasi kepala
- P: Memberitahukan hasil pemeriksaan; Konseling tanda bahaya kehamilan TM3; Konseling tanda Persalinan; Rencana cek lab ulang DL (HB 10.1)

**Poli Bersalin (Labor):**
- S: Ibu mengatakan mules-mules dan ingin mengedan
- O: ku baik kes cm ttv dbn, tfu 30 cm djj 143x/mnt preskep his: 4x10x45" vt:v/v tak portio tidak teraba pembukaan 10 cm preskep ketuban utuh
- A: G2P1A0 Pk 2
- P: memberitahu hasil pemeriksaan, menyiapkan alat, melakukan mobilisasi miring kiri/kanan, ketuban pecah jam 15.30 WIB warna jernih, pimpin ibu dikala his datang jam 15:35 bayi lahir spontan fbk, bayi menangis kuat, tonus otot aktif, ekstremitas merah, melakukan isap lendir dengan delee, melakukan suntik oksitosin 10 IU/IM, melakukan IMD, jam 15.40 plasenta lahir dengan MAK3 selaput utuh kotiledon lengkap, melakukan cek laserasi, perineum utuh

**Poli MTBM (Newborn):**
- S: bayi lahir spontan langsung menangis, tonus otot kuat, ekstremitas kemerahan
- O: ku: bai, RR: 47x/m, sh: 36.7, HR: 145x/m, ekstremitas kemerahan, tonus otot aktif, bayi menangis kuat, tidak ada cuping hidung, tidak ada retraksi
- A: NCB SMK Segera Lahir (Neonatus Cukup Bulan Sesuai Masa Kehamilan)
- P: memberitahu ibu hasil pemeriksaan; melakukan isap lendir dengan delee; melakukan IMD; pemeriksaan antropometri "BB: 3420 gr PB: 48 cm LK: 35 cm LD: 33 cm LP: 32 cm Lila: 12 cm"; melakukan suntik Vit. K; melakukan suntik HBs; memberikan salep mata

---

## 4. Pemeriksaan Fisik (Physical Examination)

**Tab:** Periksa Fisik  
Populated either directly or via the "Fisik" button in CPPT > Object field.

| Field | Type | Example Values |
|-------|------|----------------|
| Kesadaran | Dropdown | Compos Mentis |
| Tinggi Badan | Number (cm) | 154.5, 165 |
| Berat Badan | Number (kg) | 49.5, 64.4 |
| IMT | Calculated | 20.68, 23.51 — label: BB Normal / Overweight etc. |
| Sistole | Number (mmHg) | 100, 197 |
| Diastole | Number (mmHg) | 69, 68 |
| Respiratory Rate | Number (/min) | 20, 29 |
| Heart Rate | Number (/min) | 85 |
| Suhu | Number (°C) | 36.4 |
| Lila (Lingkar Lengan Atas) | Number (cm) | 19.5 |
| Lingkar Perut | Number (cm) | 50, 90 |
| Lingkar Kepala | Number (cm) | — |
| Catatan Perawat | Text | "ANC TM3, Cek ulang HB 17/4/2025" |
| Kondisi Tambahan | Text | — |

---

## 5. Diagnosis

**Tab:** Diagnosis

| Field | Type | Options / Notes |
|-------|------|-----------------|
| Penyakit | ICD-10 search + select | e.g. Z34 (Supervision of normal pregnancy), O80 (Single spontaneous delivery) |
| Kasus | Select | Baru, Lama |
| Jenis Diagnosa | Select | Primer, Sekunder |

---

## 6. Obat / Resep (Medication / Prescription)

**Tab:** Obat  
Medications are written per visit. Real examples captured:

| Medication | Qty | Dose |
|-----------|-----|------|
| FERRO SULFAT 300 MG | 15 | 2x1 |
| KALSIUM LAKTAT 500 MG (KALK) | 10 | 1x1 |
| VITAMIN C 50mg (ASAM ASKORBAT) | 10 | 1x1 |
| OBIMIN AF (MULTIVIT+ TAB TAMBAH DARAH) | 10 | 1x1 |

---

## 7. Form Riwayat Obstetrik (Obstetric History)

Appears as a sub-form within the ANC module. One row per prior pregnancy.

| Field | Type | Notes |
|-------|------|-------|
| Tanggal Lahir | Date picker | Date of delivery |
| Hasil Persalinan | Radio | LH (Lahir Hidup / Live Birth), LM (Lahir Mati / Stillbirth), AB (Abortus) |
| Kelamin | Radio | L (Laki-laki), P (Perempuan) |
| Penolong | Text | Who assisted: Bidan, Dokter, Dukun |
| Tempat Persalinan | Text | Where delivery occurred |
| Jenis Persalinan | Text | Normal, Sesar, etc. |
| Pendamping | Text | Support person |
| Donor Darah | Text | Blood donor info |
| Kead. Pd Lahir (Keadaan Pada Lahir) | Text | Condition at birth |
| RB Waktu Lahir | Text | Birth facility / reference |
| BB Waktu Lahir | Number (g) | Birth weight |
| Lama Menyusui | Text/number | Duration of breastfeeding |
| Keterangan | Text | Notes / remarks |
| [Add button] | Button | "Tambah" — adds another row |

Derived calculation: **G (Gravida) / P (Para) / A (Abortus)** — auto-calculated from obstetric history rows

---

## 8. Form Nifas (Postpartum)

**Poli:** Nifas

| Field | Type | Notes |
|-------|------|-------|
| Catat Buku KIA | Text/select | Whether KIA booklet was documented |
| Vitamin A Ibu | Text | |
| Fe (Iron) | Text | Iron tablet administration |
| Pemeriksaan C94 | Text | |
| Foto Thorax | Text | Chest X-ray |
| Obat Anti Malaria | Text | |
| Obat Anti TB | Text | |
| Perencanaan Metode KB | Text | Family planning method |
| Waktu Pelaksanaan | Date/text | |
| Keadaan Tiba | Text | Condition on arrival |
| Keadaan Pulang | Text | Condition on discharge |
| Buang Air Kecil | Text | Urination status |
| Buang Air Besar | Text | Defecation status |
| Produksi ASI | Text | Breast milk production |
| Status Hamil | Text | |
| Tanggal Persalinan | Date | |
| Jenis Persalinan | Text | |
| Tempat Persalinan | Text | |
| Status Bayi Lahir | Text | |

### Postpartum Checkup Schedule (KF — Kunjungan Faskes)

| KF | Fields |
|----|--------|
| KF1 | Tanggal KF1, Klasifikasi KF1, Faskes KF1, Tindakan KF1 |
| KF2 | Tanggal KF2, Klasifikasi KF2, Faskes KF2, Tindakan KF2 |
| KF3 | Tanggal KF3, Klasifikasi KF3, Faskes KF3, Tindakan KF3 |
| KF4 | Tanggal KF4, Klasifikasi KF4, Faskes KF4, Tindakan KF4 |
| Nasehat | Text | Advice/counseling given |

---

## 9. Form MTBM — Bayi Baru Lahir (Neonatal / Young Infant Assessment)

**Poli:** MTBM (Manajemen Terpadu Bayi Muda)  
Patient name format: `BAYI NY [MOTHER'S NAME]`

### 9a. Danger Signs Screening
**Section: MEMERIKSA KEMUNGKINAN PENYAKIT SANGAT BERAT / INFEKSI BAKTERI**

All questions: Ya / Tidak

1. Apakah ada tanda biru di sekitar mulut saat menangis dan/atau disertai sesak nafas?
2. Apakah tidak BAB 48 jam setelah lahir?
3. Apakah muntah berisi susu atau cairan berwarna hijau?
4. Apakah perut kembung dan sulit bernafas?
5. Apakah tampak lemah / tidak mau menghisap?
6. Lemah, tidak kuat bergerak dan tidak mau menghisap
7. Gerakan kejang (spontan tidak terkendali dan tidak berhenti saat dipegang)
8. Suhu tubuh ≥37.5°C atau ≤36.5°C

### 9b. Breastfeeding Assessment

| Field | Type | Notes |
|-------|------|-------|
| Apakah bayi disusui? | Ya/Tidak | |
| Jika Iya, berapa kali dalam 24 jam? | Number spinner | |
| Apakah bayi diberi minum selain ASI? | Ya/Tidak | |
| Jika Iya, berapa kali dalam 24 jam? | Number spinner | |
| Alat apa yang digunakan? | Text | Botol, cangkir, lainnya |
| Apakah cara ibu membersihkan alat makan sudah benar? | Ya/Tidak | |
| Apakah minuman yang diberikan sebagai tambahan/pengganti? | Text | |

**Breastfeeding position checklist (instructional — displayed as guidance text):**
- Seluruh badan bayi tersanggah dengan baik
- Kepala dan tubuh bayi lurus
- Badan bayi menghadap ke dada ibu
- Badan bayi dekat ke ibu

### 9c. Weight for Age

| Field | Type | Notes |
|-------|------|-------|
| BB/U ≤ -2 SD | Number | Below -2 SD (underweight) |
| BB/U > -2 SD | Number | Normal weight range |

### 9d. Neonatal Anthropometry (from CPPT Planning note)

Documented in CPPT Planning as free text. Fields to capture:
- BB (Berat Badan) — grams
- PB (Panjang Badan) — cm
- LK (Lingkar Kepala) — cm
- LD (Lingkar Dada) — cm
- LP (Lingkar Perut) — cm
- Lila (Lingkar Lengan Atas) — cm

### 9e. Birth Procedures (from CPPT Planning note)

Checklist documented in Planning:
- Isap lendir dengan delee (suction)
- IMD (Inisiasi Menyusu Dini — early breastfeeding initiation)
- Suntik Vitamin K
- Suntik HBs (Hepatitis B vaccine)
- Salep mata (eye ointment)

---

## 10. Form Imunisasi (Immunization)

**Poli:** Imunisasi  
Patient is the baby/child. Form captures parent demographics and immunization history.

### 10a. Parent Information

| Field | Type |
|-------|------|
| Nama Ayah | Text |
| Pekerjaan Ayah | Text |
| Pendidikan Ayah | Text |
| Nama Ibu | Text |
| Pekerjaan Ibu | Text |
| Pendidikan Ibu | Text |

### 10b. KIA Book & Birth Services

| Field | Type | Options |
|-------|------|---------|
| Punya Buku KIA | Ya/Tidak | Does the family have the maternal & child health booklet? |
| Catat Buku KIA | Ya/Tidak | Is the booklet up to date? |
| Vit. A 6 Bulan | Text | Merah (red dose), Biru (blue dose) |
| Jam Lahir | Time | Birth time |
| Pelayanan Saat Lahir | Text/checklist | IMD, Injeksi Vit K1, Salep Mata |

### 10c. Weight Monitoring

| Field | Type | Options |
|-------|------|---------|
| Status Berat Badan Bayi | Select | N, T, O, B |

Legend:
- **N** — Berat badan naik sesuai garis pertumbuhan (follows growth curve)
- **T** — Tidak naik / tidak mengikuti garis pertumbuhan (not gaining adequately)
- **O** — Tidak ditimbang bulan lalu (not weighed last month)
- **B** — Baru pertama kali ditimbang (first time weighed)

### 10d. Neonatal Checkup Completion

| Field | Type |
|-------|------|
| Apakah periksa KN1? | Ya/Tidak |
| Apakah periksa KN2? | Ya/Tidak |
| Apakah periksa KN3? | Ya/Tidak |

---

## 11. Register Persalinan (Birth Register — External Google Sheets)

Elisa maintains a separate Google Sheets register for all deliveries. This is the **external paper-equivalent register** that Larinova could replace with structured data export.

**Sheet name:** REGISTER PERSALINAN RB PKM SETIABUDI  
**Sheet tabs:** Monthly (DESEMBER 2025, JANUARI 2026, MARET 2026, APRIL 2026)

| Column | Notes |
|--------|-------|
| Apgar Score | e.g. 8/9 |
| Komplikasi BBL | Neonatal complications |
| KB Pasca Salin | Post-delivery family planning (e.g. IMPLAN T 2, R/ IUD) |
| TD | Blood pressure at delivery |
| Pemakaian Obat & Alkes | Medications & devices used: Handscoon (1), spuit 1cc, spuit 3cc, Oxytocin, umbilical cord, underpad, HBO benang 2.0 |
| Penolong Persalinan | Birth attendants (e.g. Bd. Rotua, Bd. Melki, Bd. Putri) |
| Metode Pembayaran | BPJS / Umum / etc. |
| Catatan | Notes |
| E Cohort | Cohort tracking |
| Akte Kelahiran | Birth certificate status (BUAT AKTE) |

---

## 12. Common Abbreviations Used by Clinicians

| Abbreviation | Full form | Meaning |
|---|---|---|
| ANC | Antenatal Care | Antenatal check |
| ku | Keadaan Umum | General condition |
| kes | Kesadaran | Consciousness |
| cm | Compos Mentis | Alert, oriented |
| ttv | Tanda-Tanda Vital | Vital signs |
| dbn | Dalam Batas Normal | Within normal limits |
| tfu | Tinggi Fundus Uteri | Uterine fundal height |
| djj | Denyut Jantung Janin | Fetal heart rate (x/mnt = beats/min) |
| preskep | Presentasi Kepala | Cephalic (head) presentation |
| his | Kontraksi Uterus | Uterine contractions (format: freq x duration x intensity, e.g. 4x10x45") |
| vt | Vaginal Toucher | Vaginal examination |
| PAP | Pintu Atas Panggul | Pelvic brim — fetal head engaged |
| BM PAP | Bawah/Masuk PAP | Head descended into pelvic inlet |
| G_P_A_ | Gravida/Para/Abortus | Obstetric formula |
| JTHI | Janin Tunggal Hidup Intra-uterine | Single live intrauterine fetus |
| NCB SMK | Neonatus Cukup Bulan Sesuai Masa Kehamilan | Term appropriate-for-gestational-age neonate |
| Pk | Partus Kala | Stage of labor (Pk1, Pk2) |
| MAK3 | Manajemen Aktif Kala 3 | Active management of 3rd stage of labor |
| IMD | Inisiasi Menyusu Dini | Early breastfeeding initiation |
| delee | Suction device | Bulb/delee suction for airway clearance |
| fbk | Fleksi Belakang Kepala | Vertex delivery (normal head position) |
| HPHT | Hari Pertama Haid Terakhir | Last Menstrual Period (LMP) |
| HPL | Hari Perkiraan Lahir | Estimated Due Date (EDD) |
| KEK | Kekurangan Energi Kronis | Chronic Energy Deficiency (LILA < 23.5 cm) |
| LILA | Lingkar Lengan Atas | Mid-upper arm circumference |
| KF1–KF4 | Kunjungan Faskes (Nifas) | Postnatal facility visits |
| KN1–KN3 | Kunjungan Neonatal | Neonatal check visits |
| KIA | Kesehatan Ibu dan Anak | Maternal & Child Health booklet |
| DL | Darah Lengkap | Complete blood count |
| HB | Hemoglobin | Hemoglobin level |
| GDP | Gula Darah Puasa | Fasting blood glucose |
| GDP2PP | Gula Darah 2 Jam Post-Prandial | 2-hour postprandial glucose |
| GDS | Gula Darah Sewaktu | Random blood glucose |
| TM | Trimester | Pregnancy trimester (TM1/TM2/TM3) |

---

## 13. Implications for Larinova

### What Larinova replaces
- Manual CPPT (SOAP) entry: clinicians type freeform notes after every patient. This is the primary bottleneck.
- Larinova listens to the consultation and auto-generates S, O, A, P, Edukasi, and Pengkajian Nyeri.

### What Larinova captures as structured data
For hospital integration, Larinova needs to output:
1. **CPPT** (S/O/A/P) — already structured in the transcript
2. **Pemeriksaan Fisik** — vital signs extracted from conversation
3. **Diagnosis** — ICD-10 code + Kasus + Jenis Diagnosa
4. **Obat** — medication name, qty, dose
5. **Form-specific fields** — e.g. Trimester, Kunjungan Ke, HPHT, LILA for ANC; anthropometry for MTBM

### Form fields that AI can extract from voice
| Field | Extractable from voice? | Notes |
|-------|------------------------|-------|
| LILA | Yes | Clinician reads value |
| TFU | Yes | "tfu dua delapan" = 28 cm |
| DJJ | Yes | "djj seratus empat puluh dua" |
| His | Yes | "empat kali sepuluh kali empat puluh lima detik" |
| Sistole/Diastole | Yes | "tekanan darah seratus per enam puluh" |
| Trimester | Yes | Derived from gestational age if mentioned |
| Assessment (G/P/A) | Yes | Mentioned in consultation |
| ICD-10 | Partially | Can suggest based on Assessment text |
| HPHT/HPL | Yes | If date is mentioned in conversation |
| Medications | Yes | Clinician dictates prescription |

### Fields that still require manual entry
- Rekam Medis (pre-filled from registration)
- Cara Masuk (pre-filled or quick tap)
- Kunjungan Ke (quick select K1–K6)
- Lab results (GDS, GDP, HB etc.) — unless clinician reads them aloud
