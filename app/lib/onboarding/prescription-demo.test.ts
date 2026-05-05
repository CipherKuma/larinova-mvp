import { describe, expect, it } from "vitest";
import {
  getEmptyPrescription,
  hasExplicitMedicineMention,
  sanitizePrescriptionDemo,
  sourceTextForPrescription,
} from "./prescription-demo";

describe("onboarding prescription demo guardrails", () => {
  it("returns an empty prescription by default", () => {
    expect(getEmptyPrescription("in").medicines).toEqual([]);
    expect(getEmptyPrescription("id").medicines).toEqual([]);
  });

  it("does not treat diagnosis-only text as an explicit medicine", () => {
    const source = sourceTextForPrescription(
      {
        subjective: "Patient has fever and cough for two days.",
        assessment: "Likely viral upper respiratory infection.",
      },
      "Patient has fever, cough, and throat irritation.",
    );

    expect(hasExplicitMedicineMention(source)).toBe(false);
  });

  it("detects explicitly spoken medicines", () => {
    expect(
      hasExplicitMedicineMention(
        "Give paracetamol 500 mg after food for three days.",
      ),
    ).toBe(true);
    expect(hasExplicitMedicineMention("Take Dolo 650 tonight.")).toBe(true);
  });

  it("drops hallucinated medicines that were not stated in source text", () => {
    const source = "Give paracetamol 500 mg after food for three days.";

    expect(
      sanitizePrescriptionDemo(
        {
          patient_name: "Ravi Kumar",
          patient_sex: "M",
          patient_age: "45",
          medicines: [
            {
              name: "PARACETAMOL 500MG",
              frequency: "1-0-1",
              duration: "3 days",
              timing: "After food",
            },
            {
              name: "AMOXICILLIN 250MG",
              frequency: "1-1-1",
              duration: "5 days",
              timing: "After food",
            },
          ],
        },
        source,
        "in",
      ).medicines,
    ).toEqual([
      {
        name: "PARACETAMOL 500MG",
        frequency: "1-0-1",
        duration: "3 days",
        timing: "After food",
      },
    ]);
  });
});
