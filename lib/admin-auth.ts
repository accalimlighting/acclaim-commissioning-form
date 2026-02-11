/**
 * Lightweight admin gate: when ADMIN_SECRET is set, requests must include
 * header x-admin-key matching that value. If ADMIN_SECRET is not set, no check
 * is performed (convenient for local dev; set in production).
 */

export function requireAdmin(request: Request): Response | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;

  const key = request.headers.get("x-admin-key");
  if (key !== secret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
