# Larinova OPD Workflow Architecture and Flowcharts

**Date:** 2026-05-06

## 1. OPD Visit Flow

```text
Patient books / walks in
        |
        v
Patient profile is created or selected
        |
        v
Intake details are collected
        |
        v
Doctor starts consultation
        |
        v
Larinova records and transcribes consultation
        |
        v
Doctor reviews AI-assisted clinical draft
        |
        +-------------------+
        |                   |
        v                   v
Prescription          Medical certificate
        |                   |
        v                   v
Doctor review       Doctor review
        |                   |
        v                   v
Final document      Signed/stamped certificate
        |                   |
        +---------+---------+
                  |
                  v
Saved to patient record
                  |
                  v
Shared / printed / sent as required
```

## 2. Medical Certificate Flow

```text
Doctor opens Documents
        |
        v
Select "Medical Certificate"
        |
        v
Select patient
        |
        v
Patient demographics auto-fill
        |
        v
Select certificate type
        |
        v
Enter doctor-reviewed clinical details
        |
        v
Enter Indian-format verification fields
        |
        +-- Patient signature/thumb impression
        +-- Identification mark 1
        +-- Identification mark 2, optional
        +-- Examination date
        +-- Place
        |
        v
Generate draft certificate
        |
        v
Doctor verifies dates, diagnosis, registration number
        |
        v
Doctor signs and stamps
        |
        v
Certificate is saved to patient record
```

## 3. Hospital Integration Flow

```text
Hospital HIS / EMR
        |
        | Patient / appointment data
        v
Larinova integration gateway
        |
        v
Larinova OPD workflow
        |
        | Consultation completed
        v
Documents generated
        |
        +-- Prescription
        +-- SOAP note
        +-- Consultation summary
        +-- Medical certificate
        |
        v
Doctor approval
        |
        v
Integration gateway
        |
        | Document/status event
        v
Hospital HIS / EMR
```

## 4. Certificate Control Points

| Control point | Why it matters |
|---|---|
| Authenticated doctor | Prevents anonymous certificate generation. |
| Patient linked to doctor record | Keeps certificate tied to real OPD workflow. |
| Doctor registration number | Required trust signal for Indian certificates. |
| Patient signature/thumb and identification mark | Required in the recommended Indian certificate format. |
| Draft status before signature | Prevents AI/document draft from being treated as final. |
| Doctor signature and clinic seal | Required before external use. |
| Document record copy | Supports register/copy retention. |
| Future QR/verification link | Helps hospitals, HR, and recipients verify authenticity. |
