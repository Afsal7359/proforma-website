import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import type { Role } from "./types";

const COOKIE = "pfc_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type Session = {
  uid: string;
  role: Role;
  name: string;
  loginId: string;
  /** clients only — their `clients.id` */
  clientId?: string;
  /** tutors only — their `tutors.id` */
  tutorId?: string;
  mustChangePassword: boolean;
};

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with: openssl rand -base64 48",
    );
  }
  return new TextEncoder().encode(s);
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Cached per-request so a page with many server components verifies once. */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
});

/** Where each role lands after login. */
export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/tutor";
  return "/portal";
}
