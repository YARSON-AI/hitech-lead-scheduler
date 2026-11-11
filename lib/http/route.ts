import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { currentActor } from "@/lib/auth/actor";
import type { Actor, Role } from "@/lib/auth/types";
import { adminClient } from "@/lib/supabase/admin";
import { withTrace } from "@/lib/trace";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const forbidden = () => new ApiError(403, "forbidden", "אין הרשאה לפעולה זו");
export const notFound = () => new ApiError(404, "not_found", "לא נמצא");

const GENERIC = "משהו השתבש. נסה/י שוב.";

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  const allowed = process.env.APP_ORIGIN ?? `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (origin !== allowed) throw new ApiError(403, "bad_origin", GENERIC);
}

export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await adminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}

type Params = Record<string, string>;

interface Context<S, A> {
  actor: A;
  body: S;
  params: Params;
  query: URLSearchParams;
  request: NextRequest;
}

function fail(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  console.error(JSON.stringify({ level: "error", at: "api", name: (error as Error)?.name, message: (error as Error)?.message }));
  return NextResponse.json({ error: "server_error", message: GENERIC }, { status: 500 });
}

async function parse<T extends z.ZodType>(request: NextRequest, schema: T | undefined): Promise<z.infer<T>> {
  if (!schema) return undefined as z.infer<T>;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "bad_request", GENERIC);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, "bad_request", GENERIC);
  return parsed.data;
}

function isMutation(request: NextRequest): boolean {
  return request.method !== "GET" && request.method !== "HEAD";
}

export function route<T extends z.ZodType = z.ZodUndefined>(
  options: { roles: Role[]; schema?: T; allowAal1?: boolean; trace?: string },
  handler: (context: Context<z.infer<T>, Actor>) => Promise<unknown>,
) {
  return async (request: NextRequest, segment: { params?: Promise<Params> }) => {
    try {
      if (isMutation(request)) assertSameOrigin(request);
      const actor = await currentActor();
      if (!actor) throw new ApiError(401, "unauthenticated", "יש להתחבר מחדש");
      if (!options.roles.includes(actor.role)) throw forbidden();
      if (actor.role === "manager" && actor.aal !== "aal2" && !options.allowAal1) {
        throw new ApiError(403, "second_step_required", "נדרש אימות דו-שלבי");
      }
      const body = await parse(request, options.schema);
      const params = (await segment.params) ?? {};
      const run = () => handler({ actor, body, params, query: request.nextUrl.searchParams, request });
      const result = options.trace ? await withTrace(options.trace, actor.role, run) : await run();
      return result instanceof NextResponse ? result : NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export function publicRoute<T extends z.ZodType = z.ZodUndefined>(
  options: { schema?: T; trace?: string },
  handler: (context: Context<z.infer<T>, null>) => Promise<unknown>,
) {
  return async (request: NextRequest, segment: { params?: Promise<Params> }) => {
    try {
      if (isMutation(request)) assertSameOrigin(request);
      const body = await parse(request, options.schema);
      const params = (await segment.params) ?? {};
      const run = () => handler({ actor: null, body, params, query: request.nextUrl.searchParams, request });
      const result = options.trace ? await withTrace(options.trace, "customer_link", run) : await run();
      return result instanceof NextResponse ? result : NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return fail(error);
    }
  };
}
