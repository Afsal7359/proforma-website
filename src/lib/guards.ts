import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";
import type { Role } from "./types";

/**
 * Page-level guards. `src/proxy.ts` already blocks unauthenticated traffic at
 * the edge; these run again in the server component so a route can never render
 * data for the wrong role even if the edge layer is bypassed or misconfigured.
 * Next.js has shipped middleware auth-bypass CVEs before — this is why the
 * check is repeated here rather than trusted once at the edge.
 */
async function require(roles: Role[], loginNext: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  if (!roles.includes(session.role)) redirect("/login?error=forbidden");
  if (session.mustChangePassword) redirect("/change-password");
  return session;
}

export const requireAdmin = () => require(["admin"], "/admin");
export const requireTutor = () => require(["tutor"], "/tutor");
export const requireClient = () => require(["client"], "/portal");
/** Admins can view everything a tutor can. */
export const requireStaff = () => require(["admin", "tutor"], "/tutor");

/** For the change-password page itself, which must be reachable mid-flow. */
export async function requireAnyUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
