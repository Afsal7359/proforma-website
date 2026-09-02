import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge gate for the three panels. Page-level guards in `src/lib/guards.ts`
 * repeat these checks server-side — this layer exists so an unauthenticated
 * request never even reaches a dashboard render.
 */

const AREAS: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/tutor", roles: ["tutor"] },
  { prefix: "/portal", roles: ["client"] },
];

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const area = AREAS.find(
    (a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`),
  );
  if (!area) return NextResponse.next();

  const token = req.cookies.get("pfc_session")?.value;
  if (!token) return toLogin(req, pathname);

  try {
    const { payload } = await jwtVerify(token, secret());
    const role = String(payload.role ?? "");

    if (!area.roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=forbidden";
      return NextResponse.redirect(url);
    }

    if (payload.mustChangePassword === true) {
      const url = req.nextUrl.clone();
      url.pathname = "/change-password";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Expired or tampered token — clear it and send them back to login.
    const res = toLogin(req, pathname);
    res.cookies.delete("pfc_session");
    return res;
  }
}

function toLogin(req: NextRequest, next: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/tutor/:path*", "/portal/:path*"],
};
