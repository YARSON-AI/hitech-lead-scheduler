import "server-only";
import { serverEnv } from "@/lib/env/server";
import { traced } from "@/lib/trace";
import { liveAirtable } from "./live";
import { stubAirtable } from "./stub";
import type { Airtable } from "./types";

const summary = (method: string, result: unknown): Record<string, unknown> => (method === "listAgents" ? { agents: (result as unknown[]).length } : {});

const stub = traced("airtable", stubAirtable, summary);
const live = traced("airtable", liveAirtable, summary);

export function airtable(): Airtable {
  return serverEnv().AIRTABLE_MODE === "live" ? live : stub;
}

function remembered<T>(ttlMs: number, load: () => Promise<T>): () => Promise<T> {
  let loadedAt = 0;
  let value: Promise<T> | null = null;
  return () => {
    if (!value || Date.now() - loadedAt > ttlMs) {
      loadedAt = Date.now();
      const next = load();
      value = next;
      next.catch(() => {
        if (value === next) value = null;
      });
    }
    return value;
  };
}

export const agentDirectory = remembered(60_000, () => airtable().listAgents());
export const specializationList = remembered(300_000, () => airtable().listSpecializations());

export type { Airtable, RosterAgent, Specialization } from "./types";
