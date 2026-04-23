/**
 * KKI (Konsil Kedokteran Indonesia) — Indonesia medical council registration lookup.
 * No public API available as of 2026-04. This stub accepts a registration number,
 * stores it as-is, and returns {verified: 'pending'}. Async verification is a future task.
 */
export interface KkiLookupResult {
  registrationNumber: string;
  verified: "pending" | "verified" | "failed";
  doctorName?: string;
  specialty?: string;
}

export async function lookupKki(
  registrationNumber: string,
): Promise<KkiLookupResult> {
  if (!registrationNumber || registrationNumber.trim().length < 5) {
    throw new Error("Invalid KKI registration number");
  }

  return {
    registrationNumber: registrationNumber.trim(),
    verified: "pending",
  };
}
