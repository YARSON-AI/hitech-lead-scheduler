import { expect, test, type Page } from "@playwright/test";
import { admin, COORDINATOR, D, login, outbox, postJson } from "./helpers";

const AGENT_ID = "recAgent012";

test.describe.configure({ mode: "serial" });

async function firstSlot(page: Page, body: object) {
  const response = await postJson(page, "/api/app/slots", body);
  expect(response.ok()).toBe(true);
  const { slots } = await response.json();
  const date = Object.keys(slots).sort()[0];
  return { date, time: slots[date][0], slots };
}

async function bookThroughScreen(page: Page, lead: string, note?: string) {
  await page.goto("/");
  await page.locator("input").first().fill(lead);
  await page.getByRole("button", { name: "המשך" }).click();
  await page.getByRole("button", { name: "קביעת פגישה" }).click();
  const time = page.getByRole("button", { name: /^\d\d:\d\d$/ }).first();
  await expect(time).toBeVisible({ timeout: 20000 });
  await time.click();
  if (note) await page.locator("textarea").fill(note);
  await page.getByRole("button", { name: /אישור מועד/ }).click();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible({ timeout: 20000 });
}

test.beforeEach(async ({ page }) => {
  await login(page, COORDINATOR);
});

test("a coordinator books a lead end to end on the stub", async ({ page }) => {
  const lead = "10013";
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", lead).eq("status", "confirmed");
  await bookThroughScreen(page, lead, "e2e note");
  const { data } = await admin().from("bookings").select("*").eq("lead_number", lead).eq("status", "confirmed").single();
  expect(data.assignment_mode).toBe("auto");
  expect(data.outlook_event_id).toBeTruthy();
  expect(data.teams_join_url).toContain("teams");
  const sent = outbox().filter((entry) => entry.event === "booking.created" && entry.payload.bookingId === data.id);
  expect(sent).toHaveLength(1);
  expect(sent[0].payload.customerEmail).toBe(`customer10013@${D}`);
  expect(sent[0].payload.notes).toBe("e2e note");
  expect(data.notes).toBe("e2e note");
  const { data: events } = await admin().from("booking_events").select("action, actor_role").eq("booking_id", data.id);
  expect(events).toContainEqual({ action: "created", actor_role: "coordinator" });
});

test("the slots response carries no agent identities", async ({ page }) => {
  const response = await postJson(page, "/api/app/slots", { mode: "auto", leadNumber: "10014" });
  const text = await response.text();
  expect(text).not.toContain("@");
  expect(text).not.toContain("recAgent");
});

test("two concurrent bookings on one slot cannot both succeed", async ({ page }) => {
  const body = { mode: "manual", agentId: AGENT_ID };
  const { date, time } = await firstSlot(page, { ...body, leadNumber: "10014" });
  const results = await Promise.all(
    ["10014", "10017"].map((leadNumber) => postJson(page, "/api/app/bookings", { ...body, leadNumber, date, time, forced: false })),
  );
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
});

test("force booking records the flag and keeps the uniqueness rule", async ({ page }) => {
  const year = new Date().getFullYear();
  const { data: existing } = await admin().from("bookings").select("start_at").eq("forced", true).eq("lead_number", "10018").eq("status", "confirmed");
  const offset = (existing?.length ?? 0) + Math.floor(Math.random() * 28);
  const date = `${year + 1}-03-${String(1 + (offset % 28)).padStart(2, "0")}`;
  const body = { mode: "manual", agentId: AGENT_ID, leadNumber: "10018", date, time: "23:15", forced: true };
  const first = await postJson(page, "/api/app/bookings", body);
  expect(first.status()).toBe(200);
  const { id } = await first.json();
  const { data } = await admin().from("bookings").select("forced").eq("id", id).single();
  expect(data!.forced).toBe(true);
  const { data: events } = await admin().from("booking_events").select("action").eq("booking_id", id);
  expect(events!.map((event) => event.action)).toContain("forced");
  expect((await postJson(page, "/api/app/bookings", body)).status()).toBe(409);
  await admin().from("bookings").update({ status: "cancelled" }).eq("id", id);
});

test("a spouse booking goes to the partner's agent and links both ways", async ({ page }) => {
  await admin().from("bookings").update({ status: "cancelled" }).in("lead_number", ["10015", "10016"]).eq("status", "confirmed");
  const first = await firstSlot(page, { mode: "manual", agentId: "recAgent013", leadNumber: "10015" });
  const partner = await postJson(page, "/api/app/bookings", { mode: "manual", agentId: "recAgent013", leadNumber: "10015", date: first.date, time: first.time, forced: false });
  expect(partner.status()).toBe(200);
  const partnerId = (await partner.json()).id;
  const spouseBody = { mode: "spouse", leadNumber: "10016", spouseLeadNumber: "10015" };
  const second = await firstSlot(page, spouseBody);
  const booked = await postJson(page, "/api/app/bookings", { ...spouseBody, date: second.date, time: second.time, forced: false });
  expect(booked.status()).toBe(200);
  const id = (await booked.json()).id;
  const { data } = await admin().from("bookings").select("id, spouse_booking_id, agent_email, profile, assignment_mode").in("id", [id, partnerId]);
  const mine = data!.find((row) => row.id === id)!;
  const theirs = data!.find((row) => row.id === partnerId)!;
  expect(mine.spouse_booking_id).toBe(partnerId);
  expect(theirs.spouse_booking_id).toBe(id);
  expect(mine.agent_email).toBe(theirs.agent_email);
  expect(mine.profile).toBe("spouse");
});

test("a spouse meeting can be attached right next to the partner's meeting", async ({ page }) => {
  await admin().from("bookings").update({ status: "cancelled" }).in("lead_number", ["10019", "10020"]).eq("status", "confirmed");
  const first = await firstSlot(page, { mode: "manual", agentId: "recAgent013", leadNumber: "10019" });
  const partner = await postJson(page, "/api/app/bookings", { mode: "manual", agentId: "recAgent013", leadNumber: "10019", date: first.date, time: first.time, forced: false });
  expect(partner.status()).toBe(200);
  const partnerId = (await partner.json()).id;
  const { data: partnerRow } = await admin().from("bookings").select("start_at, end_at").eq("id", partnerId).single();

  await page.goto("/");
  await page.locator("input").first().fill("10020");
  await page.getByRole("switch", { name: "בן/בת זוג" }).click();
  await page.locator("input").nth(1).fill("10019");
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByRole("radio", { name: /הצמדה לפגישה הקיימת/ })).toHaveAttribute("aria-checked", "true", { timeout: 20000 });
  const book = page.getByRole("button", { name: "קביעת פגישה" });
  await expect(book).toBeDisabled();
  await page.locator(".hti-pchip:not([disabled])").first().click();
  const [response] = await Promise.all([page.waitForResponse("**/api/app/bookings"), book.click()]);
  expect(response.status()).toBe(200);

  const { data } = await admin().from("bookings").select("start_at, end_at, spouse_booking_id").eq("lead_number", "10020").eq("status", "confirmed").single();
  expect(data!.spouse_booking_id).toBe(partnerId);
  const touches = new Date(data!.end_at).getTime() === new Date(partnerRow!.start_at).getTime() || new Date(data!.start_at).getTime() === new Date(partnerRow!.end_at).getTime();
  expect(touches).toBe(true);
});

test("a spouse meeting follows the partner's most recently booked meeting", async ({ page }) => {
  await admin().from("bookings").update({ status: "cancelled" }).in("lead_number", ["10019", "10020"]).eq("status", "confirmed");
  const later = await firstSlot(page, { mode: "manual", agentId: "recAgent013", leadNumber: "10019" });
  const laterDate = Object.keys(later.slots).sort()[3];
  expect((await postJson(page, "/api/app/bookings", { mode: "manual", agentId: "recAgent013", leadNumber: "10019", date: laterDate, time: later.slots[laterDate][0], forced: false })).status()).toBe(200);
  const earlier = await firstSlot(page, { mode: "manual", agentId: AGENT_ID, leadNumber: "10019" });
  const booked = await postJson(page, "/api/app/bookings", { mode: "manual", agentId: AGENT_ID, leadNumber: "10019", date: earlier.date, time: earlier.time, forced: false });
  expect(booked.status()).toBe(200);
  const latest = await booked.json();
  const check = await postJson(page, "/api/app/leads/check", { leadNumber: "10020", spouseLeadNumber: "10019" });
  const { partner } = await check.json();
  expect(partner.start).toBe(new Date(latest.start).toISOString().replace(".000Z", "+00:00"));
  expect(partner.agentName).toBe(latest.agentName);
});

test("the lead form works from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("input").first().fill("10002");
  await page.keyboard.press("Tab");
  const toggle = page.getByRole("switch", { name: "בן/בת זוג" });
  await expect(toggle).toBeFocused();
  expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  await page.keyboard.press("Space");
  const spouse = page.locator("input").nth(1);
  await expect(spouse).toBeFocused();
  await spouse.pressSequentially("10001");
  await spouse.press("Enter");
  await expect(page.getByRole("heading", { name: "הקצאת סוכן" })).toBeVisible({ timeout: 20000 });
});

test("the new-booking button starts over from the confirmation screen", async ({ page }) => {
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", "10014").eq("status", "confirmed");
  await bookThroughScreen(page, "10014");
  await page.locator("nav").getByRole("button", { name: "תיאום פגישה חדשה" }).click();
  await expect(page.locator("input").first()).toHaveValue("");
  await expect(page.getByRole("button", { name: "המשך" })).toBeVisible();
});

test("a failed handoff leaves no meeting behind", async ({ page }) => {
  const body = { mode: "manual", agentId: AGENT_ID, leadNumber: "10019" };
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", "10019").eq("status", "confirmed");
  const { date, time } = await firstSlot(page, body);
  await postJson(page, "/api/app/public/dev-stub", { failNext: "booking.created" });
  const result = await postJson(page, "/api/app/bookings", { ...body, date, time, forced: false });
  expect(result.status()).toBe(502);
  const { data } = await admin().from("bookings").select("status").eq("lead_number", "10019").eq("status", "confirmed");
  expect(data).toEqual([]);
});

test("a modified request cannot bend the rules", async ({ page }) => {
  const date = "2031-01-05";
  const base = { leadNumber: "10020", date, time: "10:00" };
  expect((await postJson(page, "/api/app/bookings", { ...base, mode: "auto", forced: true })).status()).toBe(400);
  expect((await postJson(page, "/api/app/bookings", { ...base, mode: "auto", forced: false, agentEmail: `daniel@${D}` })).status()).toBe(400);
  expect((await postJson(page, "/api/app/bookings", { ...base, mode: "manual", agentId: "recAgent004", specialization: "משכנתא", forced: false })).status()).toBe(400);
  expect((await postJson(page, "/api/app/bookings", { ...base, mode: "manual", agentId: "recAgent012", forced: false })).status()).toBe(409);
});

test("the whole flow works on a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: "he-IL", timezoneId: "Asia/Jerusalem" });
  const phone = await context.newPage();
  await login(phone, COORDINATOR);
  const lead = "10012";
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", lead).eq("status", "confirmed");
  await bookThroughScreen(phone, lead);
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});
