import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { bookingSystem } from "@/lib/env/mode";
import { homeFor, type Role } from "@/lib/auth/types";

const LEGACY_API = /^\/api\/(agents|auth|calcom|delete-allday-event|document-manual-assignment|specializations|spouse-meeting|validate-leads)(\/|$)/;
const ENGINE_ONLY = /^\/(login|set-password|admin|agent|b|dev)(\/|$)|^\/api\/(app|cron)(\/|$)/;
const PUBLIC = /^\/(set-password|b|dev)(\/|$)|^\/api\/app\/public(\/|$)|^\/api\/app\/auth\/(login|set-password|logout)$|^\/api\/cron(\/|$)/;
const LOGIN = /^\/login\/?$/;
const TWO_STEP = /^\/login\/two-step\/?$/;

const notFound = () => new NextResponse(null, { status: 404 });

function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://ht-ins.co.il",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function secured(response: NextResponse, path: string, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", /^\/(b|set-password)(\/|$)/.test(path) ? "no-referrer" : "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (/^\/b(\/|$)/.test(path)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const engine = bookingSystem() === "engine";

  if (!engine) return ENGINE_ONLY.test(path) ? notFound() : NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const forwarded = new Headers(request.headers);
  forwarded.set("x-nonce", nonce);
  forwarded.set("Content-Security-Policy", csp);
  const pass = () => NextResponse.next({ request: { headers: forwarded } });

  if (LEGACY_API.test(path)) return secured(notFound(), path, csp);
  if (PUBLIC.test(path)) return secured(pass(), path, csp);

  let response = pass();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => {
          request.cookies.set(name, value);
          forwarded.set("cookie", request.cookies.toString());
        });
        response = pass();
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirect = (to: string) => {
    const target = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    return secured(target, path, csp);
  };
  const done = () => secured(response, path, csp);

  if (!user) {
    if (LOGIN.test(path)) return done();
    if (path.startsWith("/api/")) {
      return secured(NextResponse.json({ error: "unauthenticated", message: "יש להתחבר מחדש" }, { status: 401 }), path, csp);
    }
    return redirect("/login");
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (path.startsWith("/api/")) return done();
  if (!role) return LOGIN.test(path) ? done() : redirect("/login");

  if (role === "manager") {
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const secondStepDone = level?.currentLevel === "aal2";
    if (!secondStepDone && !TWO_STEP.test(path) && !LOGIN.test(path)) return redirect("/login/two-step");
    if (secondStepDone && TWO_STEP.test(path)) return redirect(homeFor(role));
  } else if (TWO_STEP.test(path)) {
    return redirect(homeFor(role));
  }

  if (role === "agent" && (path === "/" || path.startsWith("/admin"))) return redirect("/agent");
  if (role !== "agent" && path.startsWith("/agent")) return redirect("/admin");

  return done();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
