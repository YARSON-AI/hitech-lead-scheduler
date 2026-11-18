import { expect, test, type Page } from "@playwright/test";
import { admin, AGENT, COORDINATOR, D, login, loginManager, OTHER_AGENT, outbox, postJson, ORIGIN } from "./helpers";

test.describe.configure({ mode: "serial" });

const ROSTER_AGENT = "recAgent013";

async function bookManual(page: Page, leadNumber: string, agentId = ROSTER_AGENT) {
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", leadNumber).eq("status", "confirmed");
  const slots = (await (await postJson(page, "/api/app/slots", { mode: "manual", agentId, leadNumber })).json()).slots;
  const date = Object.keys(slots).sort()[0];
  const response = await postJson(page, "/api/app/bookings", { mode: "manual", agentId, leadNumber, date, time: slots[date][0], forced: false });
  expect(response.status()).toBe(200);
  return (await response.json()).id as string;
}

const row = async (id: string) => (await admin().from("bookings").select("*").eq("id", id).single()).data;
const sent = (event: string, id: string) => outbox().filter((entry) => entry.event === event && entry.payload.bookingId === id);

test("staff reschedule, cancel, email change and transfer emit the right events", async ({ page }) => {
  await login(page, COORDINATOR);
  const id = await bookManual(page, "10001");
  const before = await row(id);
  const { slots } = await (await postJson(page, `/api/app/bookings/${id}/slots`, {})).json();
  const dates = Object.keys(slots).sort();
  const target = { date: dates[dates.length - 1], time: slots[dates[dates.length - 1]][0] };

  expect((await postJson(page, `/api/app/bookings/${id}/reschedule`, { ...target, forced: false })).status()).toBe(200);
  const moved = await row(id);
  expect(moved.start_at).not.toBe(before.start_at);
  expect(moved.agent_email).toBe(before.agent_email);
  expect(moved.teams_join_url).toBe(before.teams_join_url);
  expect(moved.outlook_event_id).toBe(before.outlook_event_id);
  expect(sent("booking.rescheduled", id)).toHaveLength(1);

  const other = await bookManual(page, "10002");
  const emailBefore = (await row(other)).customer_email;
  expect((await postJson(page, `/api/app/bookings/${id}/email`, { which: "primary", email: `changed@${D}` })).status()).toBe(200);
  expect((await row(id)).customer_email).toBe(`changed@${D}`);
  expect((await row(other)).customer_email).toBe(emailBefore);
  expect(sent("booking.email_changed", id)).toHaveLength(1);

  const { slots: newAgentSlots } = await (await postJson(page, `/api/app/bookings/${id}/transfer-slots`, { agentId: "recAgent011" })).json();
  const transferDate = Object.keys(newAgentSlots).sort()[0];
  expect((await postJson(page, `/api/app/bookings/${id}/transfer`, { agentId: "recAgent011", date: transferDate, time: newAgentSlots[transferDate][0], forced: false })).status()).toBe(200);
  const transferred = await row(id);
  expect(transferred.agent_email).toBe(`oren@${D}`);
  expect(transferred.teams_join_url).not.toBe(before.teams_join_url);
  expect(sent("booking.transferred", id)).toHaveLength(1);

  expect((await postJson(page, `/api/app/bookings/${id}/cancel`, { cancelledBy: "customer", reason: "synthetic" })).status()).toBe(200);
  const cancelled = await row(id);
  expect(cancelled.status).toBe("cancelled");
  expect(cancelled.cancelled_by).toBe("customer");
  const event = sent("booking.cancelled", id)[0];
  expect(event.payload.tag).toBe('בוטל ע"י לקוח');

  const { data: history } = await admin().from("booking_events").select("action").eq("booking_id", id);
  expect(history!.map((item) => item.action)).toEqual(expect.arrayContaining(["created", "rescheduled", "email_changed", "transferred", "cancelled"]));
  await admin().from("bookings").update({ status: "cancelled" }).eq("id", other);
});

test("a transfer moves a spouse pair together", async ({ page }) => {
  await login(page, COORDINATOR);
  const first = await bookManual(page, "10003", "recAgent014");
  const spouseBody = { mode: "spouse", leadNumber: "10004", spouseLeadNumber: "10003" };
  await admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", "10004").eq("status", "confirmed");
  const { slots } = await (await postJson(page, "/api/app/slots", spouseBody)).json();
  const date = Object.keys(slots).sort()[0];
  const second = (await (await postJson(page, "/api/app/bookings", { ...spouseBody, date, time: slots[date][0], forced: false })).json()).id;
  const response = await postJson(page, `/api/app/bookings/${first}/transfer`, { agentId: "recAgent008", date: "2031-06-01", time: "09:00", forced: true });
  expect(response.status()).toBe(200);
  expect((await row(first)).agent_email).toBe(`tamar@${D}`);
  expect((await row(second)).agent_email).toBe(`tamar@${D}`);
  for (const id of [first, second]) await admin().from("bookings").update({ status: "cancelled" }).eq("id", id);
});

test("an agent acts only on their own meetings, without force", async ({ page }) => {
  await login(page, COORDINATOR);
  const own = { id: await bookManual(page, "10005", "recAgent001") };
  const foreign = { id: await bookManual(page, "10006", "recAgent002") };
  await page.context().clearCookies();
  await login(page, AGENT);

  const foreignSlots = await postJson(page, `/api/app/bookings/${foreign.id}/slots`, {});
  expect(foreignSlots.status()).toBe(404);
  expect((await postJson(page, `/api/app/bookings/${foreign.id}/cancel`, { cancelledBy: "agent", reason: "x" })).status()).toBe(404);
  expect((await postJson(page, `/api/app/bookings/${foreign.id}/reschedule`, { date: "2031-01-05", time: "10:00", forced: false })).status()).toBe(404);
  expect((await page.goto(`/agent/meetings/${foreign.id}`))?.status()).toBe(404);

  expect((await postJson(page, `/api/app/bookings/${own.id}/reschedule`, { date: "2031-01-05", time: "10:00", forced: true })).status()).toBe(403);
  expect((await postJson(page, `/api/app/bookings/${own.id}/transfer`, { agentId: "recAgent002", date: "2031-01-05", time: "10:00", forced: false })).status()).toBe(403);
  expect((await postJson(page, `/api/app/bookings/${own.id}/email`, { which: "primary", email: `x@${D}` })).status()).toBe(403);
  expect((await postJson(page, `/api/app/bookings/${own.id}/reschedule`, { date: "2031-01-05", time: "10:00", forced: false })).status()).toBe(409);
});

test("an agent sees their cancelled meetings read-only", async ({ page }) => {
  await login(page, COORDINATOR);
  const id = await bookManual(page, "10010", "recAgent001");
  expect((await postJson(page, `/api/app/bookings/${id}/cancel`, { cancelledBy: "customer", reason: "בדיקת ביטול" })).status()).toBe(200);
  await page.context().clearCookies();
  await login(page, AGENT);
  await page.goto("/agent");
  await page.getByRole("tab", { name: /מבוטלות/ }).click();
  await expect(page).toHaveURL(/tab=cancelled/);
  const card = page.getByText("בדיקת ביטול").first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL(`**/agent/meetings/${id}`);
  await expect(page.getByText("סיבת הביטול")).toBeVisible();
  await expect(page.getByRole("button", { name: "ביטול פגישה" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "שינוי מועד" })).toHaveCount(0);
  await page.getByRole("button", { name: "חזרה לפגישות שלי" }).click();
  await expect(page).toHaveURL(/tab=cancelled/);
});

test("an agent's hours and overrides change the slots they offer", async ({ page }) => {
  await login(page, COORDINATOR);
  const body = { mode: "manual", agentId: "recAgent001", leadNumber: "10005" };
  const before = (await (await postJson(page, "/api/app/slots", body)).json()).slots;
  const date = Object.keys(before).sort()[2];
  const coordinator = page.context();
  await coordinator.clearCookies();

  await login(page, AGENT);
  expect((await postJson(page, "/api/app/schedule/overrides", { date, kind: "block", note: "e2e" })).status()).toBe(200);
  const { data: override } = await admin().from("date_overrides").select("id").eq("agent_email", AGENT).eq("date", date).eq("note", "e2e").single();
  expect((await postJson(page, "/api/app/schedule/overrides", { agentEmail: OTHER_AGENT, date, kind: "block" })).status()).toBe(403);
  await coordinator.clearCookies();

  await login(page, COORDINATOR);
  const after = (await (await postJson(page, "/api/app/slots", body)).json()).slots;
  expect(after[date]).toBeUndefined();
  await coordinator.clearCookies();

  await login(page, AGENT);
  const removed = await page.request.delete(`/api/app/schedule/overrides/${override!.id}`, { headers: { Origin: ORIGIN } });
  expect(removed.status()).toBe(200);
});

test("an agent reschedules and cancels on the phone layout", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: "he-IL", timezoneId: "Asia/Jerusalem" });
  const page = await context.newPage();
  const { data: existing } = await admin().from("bookings").select("id").eq("agent_email", AGENT).eq("lead_number", "10005").eq("status", "confirmed").single();
  await login(page, AGENT);
  await page.goto(`/agent/meetings/${existing!.id}`);
  await page.getByRole("button", { name: "שינוי מועד" }).click();
  const slot = page.getByRole("button", { name: /^\d\d:\d\d$/ }).first();
  await expect(slot).toBeVisible({ timeout: 20000 });
  await slot.click();
  await page.getByRole("button", { name: /אישור מועד|השארת המועד/ }).click();
  await page.waitForTimeout(1500);
  await page.goto(`/agent/meetings/${existing!.id}`);
  await page.getByRole("button", { name: "ביטול פגישה" }).click();
  await page.getByRole("dialog").locator("input").fill("סיבה לדוגמה");
  await page.getByRole("dialog").getByRole("button", { name: "ביטול הפגישה" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await row(existing!.id)).status).toBe("cancelled");
  await context.close();
});

test("manager settings change slots, are recorded, and are blocked for others", async ({ page }) => {
  await login(page, COORDINATOR);
  const profile = { profile: "regular", duration_min: 30, buffer_before_min: 15, buffer_after_min: 15, notice_min: 240, window_days: 21, interval_min: 30 };
  expect((await postJson(page, "/api/app/settings/profile", profile)).status()).toBe(403);
  expect((await postJson(page, "/api/app/settings/holidays", { action: "delete", id: "x" })).status()).toBe(403);
  await page.context().clearCookies();

  await loginManager(page);
  expect((await postJson(page, "/api/app/settings/profile", { ...profile, window_days: 99 })).status()).toBe(400);
  expect((await postJson(page, "/api/app/settings/profile", { ...profile, interval_min: 60 })).status()).toBe(200);
  const { data: history } = await admin().from("settings_history").select("new_value, changed_by_name").order("changed_at", { ascending: false }).limit(1).single();
  expect(history!.new_value).toBe("60");
  const slots = (await (await postJson(page, "/api/app/slots", { mode: "manual", agentId: "recAgent012", leadNumber: "10006" })).json()).slots;
  for (const times of Object.values(slots) as string[][]) expect(times.every((time) => time.endsWith(":00"))).toBe(true);
  expect((await postJson(page, "/api/app/settings/profile", profile)).status()).toBe(200);

  const date = Object.keys(slots).sort()[0];
  expect((await postJson(page, "/api/app/settings/holidays", { action: "add", name: "יום בדיקה", from: date, to: date, allDay: true })).status()).toBe(200);
  const blocked = (await (await postJson(page, "/api/app/slots", { mode: "manual", agentId: "recAgent012", leadNumber: "10006" })).json()).slots;
  expect(blocked[date]).toBeUndefined();
  const { data: added } = await admin().from("holidays").select("range_id").eq("date", date).single();
  expect((await postJson(page, "/api/app/settings/holidays", { action: "delete", id: added!.range_id })).status()).toBe(200);
});

test("the calendar view explains slots to managers only, without titles", async ({ page }) => {
  await loginManager(page);
  const today = new Date().toISOString().slice(0, 10);
  const response = await page.request.get(`/api/app/agents/recAgent001/calendar?from=${today}&days=7`);
  expect(response.status()).toBe(200);
  const { days } = await response.json();
  expect(days).toHaveLength(7);
  expect(days.flatMap((day: { blocks: object[] }) => day.blocks).length).toBeGreaterThan(0);
  expect(JSON.stringify(days)).not.toContain("subject");
  await page.context().clearCookies();
  await login(page, COORDINATOR);
  expect((await page.request.get(`/api/app/agents/recAgent001/calendar?from=${today}&days=7`)).status()).toBe(403);
});

test("changing an agent's email moves their meetings and disconnects the calendar", async ({ page }) => {
  await loginManager(page);
  const agentId = "recAgent003";
  const { data: list } = await admin().from("bookings").select("id, teams_join_url").eq("agent_email", `yossi@${D}`).eq("status", "confirmed").gte("start_at", new Date().toISOString());
  const newEmail = `yossi.new@${D}`;
  expect((await postJson(page, `/api/app/agents/${agentId}/email`, { email: `manager@${D}` })).status()).toBe(409);
  expect((await postJson(page, `/api/app/agents/${agentId}/email`, { email: newEmail })).status()).toBe(200);
  for (const booking of list ?? []) {
    const after = await row(booking.id);
    expect(after.agent_email).toBe(newEmail);
  }
  const { data: connection } = await admin().from("calendar_connections").select("connected").eq("agent_email", newEmail).single();
  expect(connection!.connected).toBe(false);
  const response = await postJson(page, `/api/app/agents/${agentId}/email`, { email: `yossi@${D}` });
  expect(response.status()).toBe(200);
  await postJson(page, "/api/app/public/dev-stub", { reconnect: `yossi@${D}` });
  await postJson(page, "/api/app/public/dev-stub", { reconnect: newEmail });
  await admin().from("calendar_connections").delete().like("agent_email", "yossi%");
  await admin().from("alerts").delete().like("agent_email", "yossi%");
});

test("a manager can pick a working-hours time on an agent's page", async ({ page }) => {
  await loginManager(page);
  await page.goto("/admin/agents/recAgent012");
  const enabled = page.locator("button.hti-ctl:not([disabled])");
  if ((await enabled.count()) === 0) await page.locator("button.hti-sw").first().click();
  const start = enabled.first();
  const next = (await start.innerText()).trim() === "06:30" ? "07:30" : "06:30";
  await start.click();
  await page.locator(".hti-pop").getByRole("button", { name: next, exact: true }).click();
  await expect(start).toHaveText(next);
});
