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

export type { Airtable, RosterAgent, Specialization } from "./types";
