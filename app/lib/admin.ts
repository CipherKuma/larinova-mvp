export const ADMIN_EMAILS = [
  "gabrielantony56@gmail.com",
  "helloseeman@gmail.com",
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (ADMIN_EMAILS as readonly string[]).includes(e);
}
