import { describe, expect, it } from "vitest";
import {
  buildMedicalCertificateContent,
  buildSickLeaveCertificateContent,
} from "./sick-leave-certificate";

describe("buildSickLeaveCertificateContent", () => {
  it("uses selected patient demographics and structured sick leave fields", () => {
    const content = buildSickLeaveCertificateContent({
      issueDate: "2026-04-30",
      patient: {
        fullName: "Raghu Kumar",
        dateOfBirth: "1995-04-30",
        gender: "male",
        address: "Casa Blanca, Koramangala, Bengaluru",
      },
      doctor: {
        fullName: "Balachandar Seeman",
        specialization: "General Practitioner",
        degrees: "MBBS",
        registrationNumber: "61089",
        registrationCouncil: "Karnataka Medical Council",
        clinicName: "Rain Tree Clinic",
        clinicAddress: "Rain Tree Towers, Bengaluru",
        phoneNumber: "+91 98765 43210",
      },
      form: {
        condition: "Acute viral fever",
        treatmentProvided: "Antipyretics, hydration, and rest",
        examinationDate: "2026-04-30",
        leaveStartDate: "2026-05-01",
        leaveEndDate: "2026-05-03",
        placeOfIssue: "Bengaluru",
        patientSignatureOrThumb: "Signature collected in clinic",
        identificationMarkOne: "Mole on left cheek",
        identificationMarkTwo: "Scar on right forearm",
        restAdvice: "Avoid strenuous activities and follow prescribed medication.",
        remarks: "Review if fever persists.",
      },
    });

    expect(content).toContain("Name: Raghu Kumar");
    expect(content).toContain("Age/Sex: 31/Male");
    expect(content).toContain("Address: Casa Blanca, Koramangala, Bengaluru");
    expect(content).toContain("Patient signature/thumb impression: Signature collected in clinic");
    expect(content).toContain("Identification mark 1: Mole on left cheek");
    expect(content).toContain("Registration No.: 61089 (Karnataka Medical Council)");
    expect(content).toContain("after careful examination on 30 Apr 2026");
    expect(content).toContain("is suffering from Acute viral fever");
    expect(content).toContain("Antipyretics, hydration, and rest");
    expect(content).toContain("3 days of sick leave from 01 May 2026 to 03 May 2026");
    expect(content).toContain("Brief Case Resume");
    expect(content).not.toContain("[Patient Full Name]");
    expect(content).not.toContain("[Age]");
  });

  it("supports work-from-home certificate wording from the same structured flow", () => {
    const content = buildMedicalCertificateContent({
      certificateType: "work_from_home",
      issueDate: "2026-05-05",
      patient: {
        fullName: "Raghu Kumar",
        dateOfBirth: "1995-04-30",
        gender: "male",
        address: "Koramangala, Bengaluru",
      },
      doctor: {
        fullName: "Balachandar Seeman",
        specialization: "General Practitioner",
        degrees: "MBBS",
        registrationNumber: "61089",
        registrationCouncil: "Karnataka Medical Council",
        clinicAddress: "Rain Tree Towers, Bengaluru",
      },
      form: {
        condition: "Post-viral fatigue",
        treatmentProvided: "Clinical review and supportive care",
        examinationDate: "2026-05-05",
        leaveStartDate: "2026-05-05",
        leaveEndDate: "2026-05-07",
        placeOfIssue: "Bengaluru",
        patientSignatureOrThumb: "Thumb impression collected",
        identificationMarkOne: "Birthmark on wrist",
        restAdvice: "Avoid commute and continue hydration.",
      },
    });

    expect(content).toContain("Work From Home Certificate");
    expect(content).toContain("advised to work from home for 3 days");
    expect(content).toContain("from 05 May 2026 to 07 May 2026");
    expect(content).toContain("Signature and seal of Registered Medical Practitioner");
  });
});
