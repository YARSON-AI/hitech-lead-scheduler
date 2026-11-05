import { z } from "zod";
import { assertSafeEnvironment } from "./guard";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  N8N_MODE: z.enum(["stub", "live"]).default("stub"),
  AIRTABLE_MODE: z.enum(["stub", "live"]).default("stub"),
  ALERT_EMAIL: z.string().email().optional(),
  LINK_TOKEN_KEY: z.string().regex(/^[0-9a-f]{64}$/),
  APP_ORIGIN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  assertSafeEnvironment();
  cached = schema.parse(process.env);
  return cached;
}
