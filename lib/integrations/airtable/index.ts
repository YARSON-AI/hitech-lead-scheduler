import "server-only";
import { serverEnv } from "@/lib/env/server";
import { stubAirtable } from "./stub";
import type { Airtable } from "./types";

export function airtable(): Airtable {
  if (serverEnv().AIRTABLE_MODE === "live") {
    throw new Error("The live Airtable integration arrives with HITECH-31");
  }
  return stubAirtable;
}

export type { Airtable, RosterAgent, Specialization } from "./types";
