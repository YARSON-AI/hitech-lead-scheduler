import { z } from "zod";
import { assertSafeEnvironment } from "./guard";

const N8N_LIVE_VARS = ["N8N_GATEWAY_URL", "N8N_GATEWAY_SECRET", "ALERT_EMAIL"] as const;
const AIRTABLE_LIVE_VARS = [
  "AIRTABLE_API_TOKEN",
  "AIRTABLE_BASE_ID",
  "AIRTABLE_AGENTS_TABLE_ID",
  "AIRTABLE_SPECIALIZATIONS_TABLE_ID",
  "AIRTABLE_MANUAL_ASSIGNMENT_DOCUMENTATION_TABLE_ID",
] as const;

const schema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    CRON_SECRET: z.string().min(16),
    N8N_MODE: z.enum(["stub", "live"]).default("stub"),
    AIRTABLE_MODE: z.enum(["stub", "live"]).default("stub"),
    N8N_GATEWAY_URL: z.string().url().startsWith("https://").optional(),
    N8N_GATEWAY_SECRET: z.string().min(32).optional(),
    AIRTABLE_API_TOKEN: z.string().optional(),
    AIRTABLE_BASE_ID: z.string().optional(),
    AIRTABLE_AGENTS_TABLE_ID: z.string().optional(),
    AIRTABLE_SPECIALIZATIONS_TABLE_ID: z.string().optional(),
    AIRTABLE_MANUAL_ASSIGNMENT_DOCUMENTATION_TABLE_ID: z.string().optional(),
    PILOT_ONLY: z.enum(["true", "false"]).default("false"),
    ALERT_EMAIL: z.string().email().optional(),
    LINK_TOKEN_KEY: z.string().regex(/^[0-9a-f]{64}$/),
    APP_ORIGIN: z.string().url().optional(),
  })
  .superRefine((env, context) => {
    const required = [...(env.N8N_MODE === "live" ? N8N_LIVE_VARS : []), ...(env.AIRTABLE_MODE === "live" ? AIRTABLE_LIVE_VARS : [])];
    for (const name of required) {
      if (!env[name]) context.addIssue({ code: "custom", path: [name], message: "Required in live mode" });
    }
  });

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  assertSafeEnvironment();
  cached = schema.parse(Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== "")));
  return cached;
}
