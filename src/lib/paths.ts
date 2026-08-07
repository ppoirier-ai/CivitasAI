/**
 * Admin-only path list, shared by the edge proxy (server) and the login page
 * (client) so the two can never drift apart. Edge-safe: pure functions only.
 */

export const ADMIN_PATHS = [
  '/dashboard',
  '/briefs',
  '/calendar',
  '/admin',
  '/api/admin',
  // Defense-in-depth (VULN-01/04): asset generation + doc ingestion are
  // admin-only. Route handlers also self-check; this is the outer gate.
  '/api/generate-pdf',
  '/api/generate-cover',
  '/api/fetch-doc',
];

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
