/**
 * Email allowlist of admin accounts. A user whose email is listed here is
 * treated as admin regardless of the profiles table / app_metadata role.
 * Configure via NEXT_PUBLIC_ADMIN_EMAILS="a@x.com,b@y.com" (comma separated).
 *
 * Edge-safe: no imports from next/navigation or React, so this module can be
 * used from the proxy (middleware), route handlers, and client code alike.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
