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

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const engine = bookingSystem() === "engine";

  if (!engine) return ENGINE_ONLY.test(path) ? notFound() : NextResponse.next();
  if (LEGACY_API.test(path)) return notFound();
  if (PUBLIC.test(path)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
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
    return target;
  };

  if (!user) {
    if (LOGIN.test(path)) return response;
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthenticated", message: "יש להתחבר מחדש" }, { status: 401 });
    }
    return redirect("/login");
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (path.startsWith("/api/")) return response;
  if (!role) return LOGIN.test(path) ? response : redirect("/login");

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
