import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import { assertSafeEnvironment } from "../../lib/env/guard";

function envValue(name: string): string {
  const line = fs.readFileSync(".env.local", "utf8").split("\n").find((row) => row.startsWith(`${name}=`));
  return (line ?? "").slice(name.length + 1).replace(/^"|"$/g, "");
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
assertSafeEnvironment({ NEXT_PUBLIC_SUPABASE_URL: url });

export const PASSWORD = envValue("SEED_PASSWORD");
export const D = "example.test";
export const MANAGER = `manager@${D}`;
export const COORDINATOR = `coordinator@${D}`;
export const AGENT = `daniel@${D}`;
export const OTHER_AGENT = `michal@${D}`;

export const admin = () =>
  createClient(url, envValue("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });

export async function userByEmail(email: string) {
  const { data } = await admin().auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users.find((user) => user.email === email) ?? null;
}

export async function removeUser(email: string) {
  const user = await userByEmail(email);
  if (user) await admin().auth.admin.deleteUser(user.id);
}

export async function clearFactors(email: string) {
  const user = await userByEmail(email);
  if (!user) return;
  const { data } = await admin().auth.admin.mfa.listFactors({ userId: user.id });
  for (const factor of data?.factors ?? []) await admin().auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of input.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totp(secret: string, now = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}

export async function fillLogin(page: Page, email: string, password = PASSWORD) {
  await admin().rpc("clear_rate_limit", { p_key: "login-ip:::1" });
  await page.goto("/login");
  const inputs = page.locator("input");
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(password);
  await Promise.all([page.waitForResponse("**/api/app/auth/login"), page.locator('button[type="submit"]').click()]);
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await fillLogin(page, email, password);
  await page.waitForURL((target) => !target.pathname.endsWith("/login"));
}

let managerSecret: string | null = null;

export async function loginManager(page: Page) {
  if (managerSecret) {
    await login(page, MANAGER);
    await page.waitForURL("**/login/two-step");
    await enterCode(page, managerSecret);
    return;
  }
  await clearFactors(MANAGER);
  await login(page, MANAGER);
  await page.waitForURL("**/login/two-step");
  const code = page.locator("code");
  await expect(code).toBeVisible();
  managerSecret = (await code.textContent())!.trim();
  await enterCode(page, managerSecret);
}

async function enterCode(page: Page, secret: string) {
  const left = 30000 - (Date.now() % 30000);
  if (left < 3000) await page.waitForTimeout(left + 200);
  await page.locator("input").last().fill(totp(secret));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin");
}

export function linkInOutbox(email: string): string | null {
  for (const entry of outbox().reverse()) {
    if (entry.channel === "email" && entry.payload?.to === email) return entry.payload.link as string;
  }
  return null;
}

export async function waitForLink(email: string, previous?: string | null): Promise<string> {
  let link: string | null = null;
  await expect
    .poll(() => {
      link = linkInOutbox(email);
      return link !== null && link !== (previous ?? null);
    }, { timeout: 15000 })
    .toBe(true);
  return link!;
}

export function outbox(): { channel: string; event: string; payload: Record<string, unknown> }[] {
  if (!fs.existsSync(".stub-state/outbox.jsonl")) return [];
  return fs.readFileSync(".stub-state/outbox.jsonl", "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

export async function postJson(page: Page, path: string, body: unknown) {
  return page.request.post(path, { data: body, headers: { Origin: "http://localhost:3000" } });
}
