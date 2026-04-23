/**
 * Xendit integration — DEFERRED until first paying Indonesia customer (Tier 3).
 * All functions currently throw or return 501.
 */
export function xenditNotImplemented(): never {
  throw new Error(
    "Xendit integration is deferred to Tier 3. Indonesia billing is not yet available.",
  );
}
