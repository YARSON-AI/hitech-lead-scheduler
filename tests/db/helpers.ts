import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { Client } from "pg";
import { assertSafeEnvironment } from "@/lib/env/guard";

assertSafeEnvironment();

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const secret = process.env.SUPABASE_SECRET_KEY!;
export const TEST_PASSWORD = "Rls-Test-Pass-1";

export function admin(): SupabaseClient {
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function anon(): SupabaseClient {
  return createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function pgClient(): Promise<Client> {
  const db = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  return db;
}

export async function makeUser(email: string, role: string, agentEmail: string | null, status = "active") {
  const db = admin();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) throw error;
  const { error: profileError } = await db
    .from("profiles")
    .insert({ id: data.user.id, email, role, full_name: email, agent_email: agentEmail, status });
  if (profileError) throw profileError;
  return data.user.id;
}

export async function removeUsersLike(prefix: string) {
  const db = admin();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const user of data?.users ?? []) {
    if (user.email?.startsWith(prefix)) await db.auth.admin.deleteUser(user.id);
  }
}

export async function signIn(email: string): Promise<SupabaseClient> {
  const client = anon();
  const { error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw error;
  return client;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of input.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totp(secretBase32: string, now = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const digest = createHmac("sha1", base32Decode(secretBase32)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(code).padStart(6, "0");
}

export async function upgradeToAal2(client: SupabaseClient): Promise<void> {
  const { data: enrolled, error } = await client.auth.mfa.enroll({ factorType: "totp" });
  if (error) throw error;
  const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
    factorId: enrolled.id,
    code: totp(enrolled.totp.secret),
  });
  if (verifyError) throw verifyError;
}
