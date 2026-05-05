import { describe, expect, it } from "vitest";
import { CLINICAL_TRANSCRIPT_BOUNDARY_RULES } from "./transcript-safety";

describe("clinical transcript boundary rules", () => {
  it("guards against another-patient interruptions being merged into notes", () => {
    expect(clinicalRuleText()).toContain("different patient");
    expect(clinicalRuleText()).toContain("Never transfer medicines");
  });
});

function clinicalRuleText() {
  return CLINICAL_TRANSCRIPT_BOUNDARY_RULES;
}
