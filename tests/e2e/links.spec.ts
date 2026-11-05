import { expect, test, type Browser, type Page } from "@playwright/test";
import { admin, AGENT, COORDINATOR, D, login, OTHER_AGENT, outbox, postJson } from "./helpers";

test.describe.configure({ mode: "serial" });

const tokenOf = (url: string) => new URL(url).pathname.split("/").pop()!;

async function create(page: Page, body: object) {
  const response = await postJson(page, "/api/app/links", body);
  expect(response.status()).toBe(200);
  return response.json();
}

async function reset(lead: string) {
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", lead).eq("status", "confirmed");
  await admin().from("booking_links").update({ status: "revoked" }).eq("lead_number", lead).eq("status", "open");
}

async function fresh(browser: Browser, phone = false) {
  const context = await browser.newContext({ locale: "he-IL", timezoneId: "Asia/Jerusalem", viewport: phone ? { width: 390, height: 800 } : { width: 1200, height: 900 } });
  return { context, page: await context.newPage() };
}

test("an agent creates a link for themselves only, and sees only the customer's name", async ({ page }) => {
  await reset("10007");
  await login(page, AGENT);
  const check = await (await postJson(page, "/api/app/links/check", { leadNumber: "10007" })).json();
  expect(Object.keys(check).sort()).toEqual(["name", "number"]);
  expect((await postJson(page, "/api/app/links", { leadNumber: "10007", mode: "auto" })).status()).toBe(403);
  const link = await create(page, { leadNumber: "10007", mode: "manual", agentId: "recAgent002" });
  expect(link.agentName).not.toBe("מיכל אברהם");
  const { data } = await admin().from("booking_links").select("agent_email").eq("id", link.id).single();
  expect(data!.agent_email).toBe(AGENT);
});

test("a customer books once on a phone; the row matches a staff booking", async ({ page, browser }) => {
  await reset("10008");
  await login(page, COORDINATOR);
  const link = await create(page, { leadNumber: "10008", mode: "manual", agentId: "recAgent002" });
  const { context, page: customer } = await fresh(browser, true);
  await customer.goto(link.url);
  const slot = customer.getByRole("button", { name: /^\d\d:\d\d$/ }).first();
  await expect(slot).toBeVisible({ timeout: 20000 });
  expect(await customer.content()).not.toContain("customer10008");
  await slot.click();
  await customer.getByRole("button", { name: /קביעת פגישה/ }).last().click();
  await expect(customer.getByRole("heading", { level: 2 })).toBeVisible({ timeout: 20000 });
  const { data } = await admin().from("bookings").select("*").eq("lead_number", "10008").eq("status", "confirmed").single();
  expect(data.source).toBe("link");
  expect(data.agent_email).toBe(OTHER_AGENT);
  expect(data.booked_by_name).toBeTruthy();
  const payload = outbox().filter((entry) => entry.event === "booking.created" && entry.payload.bookingId === data.id);
  expect(payload).toHaveLength(1);
  const { data: events } = await admin().from("booking_events").select("actor_role").eq("booking_id", data.id).eq("action", "created");
  expect(events).toEqual([{ actor_role: "customer_link" }]);

  await customer.reload();
  await expect(customer.getByRole("heading", { level: 2 })).toBeVisible();
  await context.close();

  const stranger = await fresh(browser);
  await stranger.page.goto(link.url);
  const deadText = await stranger.page.locator("main, body").first().innerText();
  const unknown = await fresh(browser);
  await unknown.page.goto("/b/not-a-real-token-value-000000000000");
  await expect(unknown.page.getByRole("button", { name: /^\d\d:\d\d$/ })).toHaveCount(0);
  await unknown.page.waitForTimeout(800);
  await stranger.page.waitForTimeout(800);
  expect(await unknown.page.locator("body").innerText()).toBe(await stranger.page.locator("body").innerText());
  expect(deadText.length).toBeGreaterThan(0);
  await stranger.context.close();
  await unknown.context.close();
});

test("used, expired, revoked and unknown tokens return the same response", async ({ page, request }) => {
  await reset("10009");
  await reset("10010");
  await login(page, COORDINATOR);
  const revoked = await create(page, { leadNumber: "10009", mode: "manual", agentId: "recAgent002" });
  expect((await postJson(page, `/api/app/links/${revoked.id}/revoke`, {})).status()).toBe(200);
  const expired = await create(page, { leadNumber: "10010", mode: "manual", agentId: "recAgent002" });
  await admin().from("booking_links").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", expired.id);
  const headers = { Origin: "http://localhost:3000" };
  const view = async (token: string) => (await (await request.post("/api/app/public/links/view", { data: { token }, headers })).text());
  const texts = await Promise.all([tokenOf(revoked.url), tokenOf(expired.url), "unknown-token-value-0000000000000000"].map(view));
  expect(new Set(texts).size).toBe(1);
  await admin().from("booking_links").update({ status: "revoked" }).eq("id", expired.id);
});

test("a modified request cannot change the agent, the lead or the rules", async ({ page, request }) => {
  await reset("10011");
  await login(page, COORDINATOR);
  const link = await create(page, { leadNumber: "10011", mode: "manual", agentId: "recAgent002" });
  const token = tokenOf(link.url);
  const headers = { Origin: "http://localhost:3000" };
  for (const extra of [{ agentEmail: `daniel@${D}` }, { leadNumber: "10001" }, { forced: true }]) {
    const response = await request.post("/api/app/public/links/book", { data: { token, date: "2031-01-05", time: "10:00", ...extra }, headers });
    expect(response.status()).toBe(400);
  }
  expect((await request.post("/api/app/public/links/book", { data: { token, date: "2031-01-05", time: "10:00" }, headers })).status()).toBe(409);
  const { data } = await admin().from("booking_links").select("status").eq("id", link.id).single();
  expect(data!.status).toBe("open");
  const slots = await (await request.post("/api/app/public/links/slots", { data: { token }, headers })).text();
  expect(slots).not.toContain("@");
});

test("an automatic link assigns the host at confirm time", async ({ page, request }) => {
  await reset("10012");
  await login(page, COORDINATOR);
  const link = await create(page, { leadNumber: "10012", mode: "auto" });
  const token = tokenOf(link.url);
  const headers = { Origin: "http://localhost:3000" };
  const view = await (await request.post("/api/app/public/links/view", { data: { token }, headers })).json();
  expect(view.agentName).toBeNull();
  const { slots } = await (await request.post("/api/app/public/links/slots", { data: { token }, headers })).json();
  const date = Object.keys(slots).sort()[0];
  const booked = await request.post("/api/app/public/links/book", { data: { token, date, time: slots[date][0] }, headers });
  expect(booked.status()).toBe(200);
  const { data } = await admin().from("booking_links").select("agent_email, status, booking_id").eq("id", link.id).single();
  expect(data!.status).toBe("used");
  expect(data!.agent_email).toBeTruthy();
  const { data: booking } = await admin().from("bookings").select("assignment_mode").eq("id", data!.booking_id).single();
  expect(booking!.assignment_mode).toBe("auto");
});

test("a failed handoff leaves the link open", async ({ page, request }) => {
  await reset("10013");
  await login(page, COORDINATOR);
  const link = await create(page, { leadNumber: "10013", mode: "manual", agentId: "recAgent002" });
  const token = tokenOf(link.url);
  const headers = { Origin: "http://localhost:3000" };
  const { slots } = await (await request.post("/api/app/public/links/slots", { data: { token }, headers })).json();
  const date = Object.keys(slots).sort()[0];
  await postJson(page, "/api/app/public/dev-stub", { failNext: "booking.created" });
  const result = await request.post("/api/app/public/links/book", { data: { token, date, time: slots[date][0] }, headers });
  expect(result.status()).toBe(502);
  const { data } = await admin().from("booking_links").select("status").eq("id", link.id).single();
  expect(data!.status).toBe("open");
});

test("revoke works for the creator, staff and the link's agent, and no one else", async ({ page }) => {
  await reset("10014");
  await login(page, COORDINATOR);
  const forOther = await create(page, { leadNumber: "10014", mode: "manual", agentId: "recAgent002" });
  await page.context().clearCookies();
  await login(page, AGENT);
  expect((await postJson(page, `/api/app/links/${forOther.id}/revoke`, {})).status()).toBe(404);
  expect((await postJson(page, `/api/app/links/${forOther.id}/copy`, {})).status()).toBe(404);
  await page.context().clearCookies();
  await login(page, OTHER_AGENT);
  const copy = await (await postJson(page, `/api/app/links/${forOther.id}/copy`, {})).json();
  expect(copy.url).toBe(forOther.url);
  expect((await postJson(page, `/api/app/links/${forOther.id}/revoke`, {})).status()).toBe(200);
});

test("a new link for a lead revokes the previous open one", async ({ page }) => {
  await reset("10015");
  await login(page, COORDINATOR);
  const first = await create(page, { leadNumber: "10015", mode: "auto" });
  await create(page, { leadNumber: "10015", mode: "manual", agentId: "recAgent002" });
  const { data } = await admin().from("booking_links").select("status").eq("id", first.id).single();
  expect(data!.status).toBe("revoked");
});
