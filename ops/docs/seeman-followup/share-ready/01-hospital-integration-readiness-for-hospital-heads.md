# Larinova Hospital Integration Readiness

**Prepared for:** Hospital leadership, medical administration, and hospital IT teams  
**Prepared by:** Larinova  
**Date:** 2026-05-06

## 1. Purpose

Larinova is an OPD workflow platform for doctors and clinics. It helps doctors manage patient intake, consultation recording/transcription, clinical notes, prescriptions, medical certificates, and follow-up workflows.

This document explains how Larinova can be evaluated by a hospital or clinic today, and how it can later integrate with hospital systems such as HIS, EMR, or interface engines.

## 2. Current Product Scope

Larinova currently focuses on the OPD workflow:

- Patient registration and profile.
- Appointment and consultation workflow.
- Real-time consultation transcription.
- SOAP-style clinical notes and summaries.
- Prescription/document workflows.
- Medical certificate generation.
- Follow-up and patient communication workflows.

## 3. Integration Position

Larinova should be presented as:

> A clinical workflow product with a clear path to hospital integration.

Larinova should not yet be presented as:

> A fully live HL7/HIS/EMR connector already deployed in production.

The recommended hospital discussion is phased:

| Phase | Scope | Purpose |
|---|---|---|
| Phase 1 | Product evaluation | Hospital doctors review the OPD workflow and document output. |
| Phase 2 | Secure API/webhook pilot | Exchange patient, appointment, consultation, prescription, and certificate events. |
| Phase 3 | Interface engine integration | Map Larinova events through Mirth/HL7/FHIR if required by the hospital. |
| Phase 4 | Formal hospital rollout | Monitoring, audit logs, signed documents, support process, and production controls. |

## 4. High-Level Architecture

```text
PATIENT / ATTENDANT
        |
        v
Patient intake / appointment booking
        |
        v
LARINOVA DOCTOR APP
        |
        +-- Patient record
        +-- Consultation transcript
        +-- SOAP summary
        +-- Prescription
        +-- Medical certificate
        +-- Follow-up task
        |
        v
LARINOVA API AND DATABASE
        |
        +-- Audit trail
        +-- Document store
        +-- Notification layer
        +-- Integration event queue
        |
        v
INTEGRATION GATEWAY
        |
        +-- REST API / Webhooks
        +-- HL7 adapter, if required
        +-- FHIR adapter, future
        |
        v
HOSPITAL HIS / EMR / INTERFACE ENGINE
```

## 5. Data Objects for Hospital Review

| Data object | Direction | Hospital value |
|---|---|---|
| Patient demographics | HIS to Larinova or Larinova to HIS | Avoid duplicate entry. |
| Appointment/encounter | HIS to Larinova | Open the correct OPD workflow for the doctor. |
| Consultation summary | Larinova to HIS | Reduce manual doctor documentation. |
| Prescription | Larinova to HIS or patient | Structured doctor-reviewed output. |
| Medical certificate | Larinova to HIS/patient/recipient | Doctor-issued certificate with audit trail. |
| Follow-up task | Larinova internal or to HIS | Patient continuity after visit. |

## 6. Hospital Evaluation Questions

1. Which HIS/EMR is currently used?
2. Does the hospital prefer REST API, webhooks, HL7, FHIR, or Mirth Connect?
3. Who owns the patient master record?
4. Should documents be stored in the HIS, sent to the patient, or both?
5. Does the hospital require physical stamp/signature, digital signature, QR verification, or all three?
6. What are the requirements for audit logs, consent, and data retention?

## 7. Recommended Next Step

The best next step is a product evaluation meeting where hospital doctors and an IT representative review:

- OPD consultation workflow.
- Medical certificate generation.
- Prescription/document output.
- Proposed integration data flow.
- Required changes before a pilot.
