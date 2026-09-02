import bcrypt from "bcryptjs";
import type { Role } from "./types";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** Unambiguous alphabet — no 0/O/1/I/l, so credentials survive being read off a phone. */
const SAFE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SAFE_LOWER = "abcdefghjkmnpqrstuvwxyz";

function pick(chars: string, n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < n; i++) out += chars[bytes[i] % chars.length];
  return out;
}

const ROLE_PREFIX: Record<Role, string> = {
  admin: "ADM",
  tutor: "COACH",
  client: "PFC",
};

/**
 * Login IDs are handed to people over WhatsApp, so they're short, typo-resistant
 * and carry their role on the front: PFC-4821, COACH-K7M2.
 */
export function generateLoginId(role: Role, seed?: string): string {
  const prefix = ROLE_PREFIX[role];
  const slug = seed
    ? seed
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 4)
    : "";
  return slug
    ? `${prefix}-${slug}${pick(SAFE_ALPHABET, 3)}`
    : `${prefix}-${pick(SAFE_ALPHABET, 5)}`;
}

/**
 * Readable one-time password: two syllable-ish blocks plus digits.
 * e.g. "Kavu-Ternu-4827"
 */
export function generatePassword(): string {
  const block = () =>
    pick(SAFE_ALPHABET, 1) + pick(SAFE_LOWER, 3).toLowerCase();
  return `${block()}-${block()}-${pick("23456789", 4)}`;
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(pw)) return "Password must contain a letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain a number.";
  return null;
}

/**
 * Pre-filled WhatsApp invite carrying the generated credentials.
 * `phone` may be entered with spaces, +, or dashes — all stripped here.
 */
export function buildWhatsAppInvite(opts: {
  phone: string | null | undefined;
  name: string;
  loginId: string;
  password: string;
  role: Role;
  siteUrl: string;
}): string | null {
  const digits = (opts.phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 ? `91${digits}` : digits;

  const portal =
    opts.role === "client" ? `${opts.siteUrl}/login` : `${opts.siteUrl}/login`;

  const lines = [
    `Hi ${opts.name}, welcome to Proforma Co! 🎯⚽`,
    ``,
    `Your athlete portal login is ready.`,
    ``,
    `🔗 ${portal}`,
    `👤 Login ID: ${opts.loginId}`,
    `🔑 Password: ${opts.password}`,
    ``,
    `Log in to see your trial calendar, training plan and progress scores.`,
    `You'll be asked to set your own password on first login.`,
  ];

  return `https://wa.me/${withCountry}?text=${encodeURIComponent(lines.join("\n"))}`;
}
