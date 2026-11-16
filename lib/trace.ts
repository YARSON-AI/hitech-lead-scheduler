import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

interface Trace {
  action: string;
  actorRole: string | null;
  started: number;
  bookingId: string | null;
  linkId: string | null;
  steps: Record<string, unknown>[];
}

const store = new AsyncLocalStorage<Trace>();

export function traceStep(step: string, data: Record<string, unknown> = {}): void {
  const trace = store.getStore();
  if (trace) trace.steps.push({ ms: Date.now() - trace.started, step, ...data });
}

export function traceIds(ids: { bookingId?: string; linkId?: string }): void {
  const trace = store.getStore();
  if (!trace) return;
  trace.bookingId ??= ids.bookingId ?? null;
  trace.linkId ??= ids.linkId ?? null;
}

async function save(trace: Trace, ok: boolean, status: number, durationMs: number): Promise<void> {
  try {
    const { error } = await adminClient()
      .from("booking_traces")
      .insert({
        action: trace.action,
        actor_role: trace.actorRole,
        booking_id: trace.bookingId,
        link_id: trace.linkId,
        ok,
        status,
        duration_ms: durationMs,
        steps: trace.steps,
      });
    if (error) throw error;
  } catch (error) {
    console.error(JSON.stringify({ level: "error", at: "trace", action: trace.action, message: (error as Error)?.message }));
  }
}

export async function withTrace<T>(action: string, actorRole: string | null, run: () => Promise<T>): Promise<T> {
  const trace: Trace = { action, actorRole, started: Date.now(), bookingId: null, linkId: null, steps: [] };
  try {
    const result = await store.run(trace, run);
    const durationMs = Date.now() - trace.started;
    after(() => save(trace, true, 200, durationMs));
    return result;
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    trace.steps.push({ ms: Date.now() - trace.started, step: "failed", code: (error as { code?: string }).code ?? (error as Error)?.name, message: (error as Error)?.message });
    const durationMs = Date.now() - trace.started;
    after(() => save(trace, false, status, durationMs));
    throw error;
  }
}

const SAFE_ARGS = ["agentEmail", "start", "previousStart", "previousAgentEmail", "cancelledBy", "tag", "which", "kind", "forced", "source"];

function argSummary(args: unknown[]): Record<string, unknown> {
  const first = args[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) return {};
  return Object.fromEntries(SAFE_ARGS.filter((key) => key in first).map((key) => [key, (first as Record<string, unknown>)[key]]));
}

export function traced<T extends object>(service: string, target: T, summarize: (method: string, result: unknown) => Record<string, unknown> = () => ({})): T {
  return new Proxy(target, {
    get(object, key, receiver) {
      const value = Reflect.get(object, key, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        if (!store.getStore()) return value.apply(object, args);
        const started = Date.now();
        try {
          const result = await value.apply(object, args);
          traceStep(`${service}.${String(key)}`, { ok: true, took: Date.now() - started, ...argSummary(args), ...summarize(String(key), result) });
          return result;
        } catch (error) {
          traceStep(`${service}.${String(key)}`, { ok: false, took: Date.now() - started, ...argSummary(args), error: (error as Error)?.message });
          throw error;
        }
      };
    },
  });
}
