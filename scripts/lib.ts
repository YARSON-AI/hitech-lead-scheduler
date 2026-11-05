import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { assertSafeEnvironment } from "../lib/env/guard";

loadEnvConfig(process.cwd());
assertSafeEnvironment();

export function dbUrl(): string {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set in .env.local");
  return url;
}

export async function withDb<T>(run: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({ connectionString: dbUrl(), ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    return await run(db);
  } finally {
    await db.end();
  }
}
