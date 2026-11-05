import { expect, test, type Page } from "@playwright/test";
import { admin, AGENT, COORDINATOR, login, loginManager } from "./helpers";

async function visit(page: Page, paths: string[]) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflow`).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
}

async function anyBookingId() {
  const { data } = await admin().from("bookings").select("id").eq("status", "confirmed").gte("start_at", new Date().toISOString()).limit(1).single();
  return data!.id as string;
}

for (const [name, viewport] of [
  ["desktop", { width: 1360, height: 900 }],
  ["phone", { width: 390, height: 800 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });

    test("every coordinator screen opens", async ({ page }) => {
      const id = await anyBookingId();
      await login(page, COORDINATOR);
      await visit(page, ["/", "/admin", "/admin?range=past", "/admin?range=cancelled", `/admin/bookings/${id}`, `/admin/bookings/${id}/reschedule`, `/admin/bookings/${id}/transfer`, "/admin/alerts", "/admin/links", "/admin/links/new"]);
    });

    test("every manager screen opens", async ({ page }) => {
      await loginManager(page);
      await visit(page, ["/admin/agents", "/admin/agents/recAgent001", "/admin/agents/recAgent001/calendar", "/admin/users", "/admin/settings"]);
    });

    test("every agent screen opens", async ({ page }) => {
      const { data } = await admin().from("bookings").select("id").eq("agent_email", AGENT).eq("status", "confirmed").gte("start_at", new Date().toISOString()).limit(1).maybeSingle();
      await login(page, AGENT);
      await visit(page, ["/agent", ...(data ? [`/agent/meetings/${data.id}`, `/agent/meetings/${data.id}/reschedule`] : []), "/agent/hours", "/agent/overrides", "/agent/links", "/agent/links/new"]);
    });
  });
}
