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
        licenseNumber: "61089",
        clinicAddress: "Rain Tree Towers, Bengaluru",
      },
      form: {
        condition: "Acute viral fever",
        treatmentProvided: "Antipyretics, hydration, and rest",
        leaveStartDate: "2026-05-01",
        leaveEndDate: "2026-05-03",
        restAdvice: "Avoid strenuous activities and follow prescribed medication.",
        remarks: "Review if fever persists.",
      },
    });

    expect(content).toContain("Name: Raghu Kumar");
    expect(content).toContain("Age/Sex: 31/Male");
    expect(content).toContain("Address: Casa Blanca, Koramangala, Bengaluru");
    expect(content).toContain("under my care for Acute viral fever");
    expect(content).toContain("Antipyretics, hydration, and rest");
    expect(content).toContain("3 days of sick leave from 01 May 2026 to 03 May 2026");
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
        licenseNumber: "61089",
        clinicAddress: "Rain Tree Towers, Bengaluru",
      },
      form: {
        condition: "Post-viral fatigue",
        treatmentProvided: "Clinical review and supportive care",
        leaveStartDate: "2026-05-05",
        leaveEndDate: "2026-05-07",
        restAdvice: "Avoid commute and continue hydration.",
      },
    });

    expect(content).toContain("Work From Home Certificate");
    expect(content).toContain("advised to work from home for 3 days");
    expect(content).toContain("from 05 May 2026 to 07 May 2026");
  });
});
