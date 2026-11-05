import "server-only";
import { serverEnv } from "@/lib/env/server";
import { stubN8n } from "./stub";
import type { N8n } from "./types";

export function n8n(): N8n {
  if (serverEnv().N8N_MODE === "live") {
    throw new Error("The live n8n integration arrives with HITECH-31");
  }
  return stubN8n;
}

export * from "./types";
