import "server-only";
import { serverEnv } from "@/lib/env/server";
import { traced } from "@/lib/trace";
import { stubAirtable } from "./stub";
import type { Airtable } from "./types";

const stub = traced("airtable", stubAirtable, (method, result) => (method === "listAgents" ? { agents: (result as unknown[]).length } : {}));

export function airtable(): Airtable {
  if (serverEnv().AIRTABLE_MODE === "live") {
    throw new Error("The live Airtable integration arrives with HITECH-31");
  }
  return stub;
}

export type { Airtable, RosterAgent, Specialization } from "./types";
