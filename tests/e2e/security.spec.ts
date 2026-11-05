import { expect, test, type Page } from "@playwright/test";
import { admin, AGENT, COORDINATOR, D, login, postJson } from "./helpers";

const SAMPLE = "00000000-0000-4000-8000-000000000000";
const STAFF_POST: [string, object][] = [
  ["/api/app/leads/check", { leadNumber: "10001" }],
  ["/api/app/slots", { mode: "auto", leadNumber: "10001" }],
  ["/api/app/bookings", { mode: "auto", leadNumber: "10001", date: "2031-01-05", time: "10:00", forced: false }],
  [`/api/app/bookings/${SAMPLE}/email`, { which: "primary", email: `x@${D}` }],
  [`/api/app/bookings/${SAMPLE}/transfer-slots`, { agentId: "recAgent001" }],
  [`/api/app/bookings/${SAMPLE}/transfer`, { agentId: "recAgent001", date: "2031-01-05", time: "10:00", forced: false }],
  [`/api/app/alerts/${SAMPLE}/resolve`, {}],
  ["/api/app/agents/recAgent001/calendar-link", {}],
];
const MANAGER_POST: [string, object][] = [
  ["/api/app/users/invite", { rosterId: "recAgent001" }],
  ["/api/app/users/coordinator", { email: `x@${D}` }],
  ["/api/app/users/reinvite", { userId: SAMPLE }],
  ["/api/app/users/deactivate", { userId: SAMPLE }],
  ["/api/app/settings/profile", { profile: "regular", duration_min: 30, buffer_before_min: 15, buffer_after_min: 15, notice_min: 240, window_days: 21, interval_min: 30 }],
  ["/api/app/settings/link-validity", { days: 7 }],
  ["/api/app/settings/holidays", { action: "delete", id: "x" }],
  ["/api/app/agents/recAgent001/email", { email: `x@${D}` }],
];
const ANY_POST: [string, object][] = [
  [`/api/app/bookings/${SAMPLE}/slots`, {}],
  [`/api/app/bookings/${SAMPLE}/cancel`, { cancelledBy: "agent", reason: "x" }],
  ["/api/app/links", { leadNumber: "10001", mode: "auto" }],
  ["/api/app/schedule/hours", { days: [] }],
];

async function statuses(page: Page, list: [string, object][]) {
  const out: Record<string, number> = {};
  for (const [path, body] of list) out[path] = (await postJson(page, path, body)).status();
  return out;
}

test("an unauthenticated caller reaches no session route", async ({ page }) => {
  const result = await statuses(page, [...STAFF_POST, ...MANAGER_POST, ...ANY_POST]);
  for (const [path, status] of Object.entries(result)) expect(status, path).toBe(401);
  expect((await page.request.get("/api/app/agents/options")).status()).toBe(401);
  expect((await page.request.get("/api/app/agents/recAgent001/calendar?from=2031-01-05")).status()).toBe(401);
});

test("an agent reaches no staff or manager route", async ({ page }) => {
  await login(page, AGENT);
  const result = await statuses(page, [...STAFF_POST, ...MANAGER_POST]);
  for (const [path, status] of Object.entries(result)) expect(status, path).toBe(403);
});

test("a coordinator reaches no manager route", async ({ page }) => {
  await login(page, COORDINATOR);
  const result = await statuses(page, MANAGER_POST);
  for (const [path, status] of Object.entries(result)) expect(status, path).toBe(403);
});

test("mutations from another origin are refused", async ({ page }) => {
  await login(page, COORDINATOR);
  const response = await page.request.post("/api/app/slots", { data: { mode: "auto", leadNumber: "10001" }, headers: { Origin: "https://evil.example.com" } });
  expect(response.status()).toBe(403);
  const none = await page.request.post("/api/app/auth/login", { data: { email: `x@${D}`, password: "x" }, headers: { Origin: "https://evil.example.com" } });
  expect(none.status()).toBe(403);
});

test("the live-app routes are closed, and cron needs its secret", async ({ page }) => {
  for (const path of ["/api/agents", "/api/auth", "/api/specializations", "/api/calcom/create", "/api/validate-leads"]) {
    expect((await page.request.get(path)).status(), path).toBe(404);
  }
  for (const path of ["/api/cron/holidays", "/api/cron/retention", "/api/cron/booking-checks"]) {
    expect((await page.request.get(path)).status(), path).toBe(401);
    expect((await page.request.get(path, { headers: { Authorization: "Bearer wrong" } })).status(), path).toBe(401);
  }
});

test("every page carries the security headers", async ({ page }) => {
  for (const path of ["/login", "/set-password", "/b/some-token-value-000000000000"]) {
    const response = await page.goto(path);
    const headers = response!.headers();
    expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"], path).toMatch(/nonce-/);
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["strict-transport-security"], path).toBeTruthy();
    expect(headers["referrer-policy"], path).toBeTruthy();
  }
  const link = await page.goto("/b/some-token-value-000000000000");
  expect(link!.headers()["referrer-policy"]).toBe("no-referrer");
  expect(link!.headers()["x-robots-tag"]).toContain("noindex");
});

test("the session cookie is httpOnly and the client gets no secret", async ({ page, context }) => {
  await login(page, COORDINATOR);
  const auth = (await context.cookies()).filter((cookie) => cookie.name.includes("auth-token"));
  expect(auth.length).toBeGreaterThan(0);
  for (const cookie of auth) expect(cookie.httpOnly).toBe(true);
  const html = await (await page.goto("/admin"))!.text();
  for (const secret of ["sb_secret_", "SUPABASE_SECRET_KEY", "LINK_TOKEN_KEY", "CRON_SECRET"]) expect(html).not.toContain(secret);
});

test("online bookings store a link, in-person ones none, a missing link raises an alert", async ({ page }) => {
  await login(page, COORDINATOR);
  const manual = { mode: "manual", agentId: "recAgent012" };
  const reset = async (lead: string) => admin().from("bookings").update({ status: "cancelled" }).eq("lead_number", lead).eq("status", "confirmed");
  await reset("10001");
  await reset("10002");
  const { slots } = await (await postJson(page, "/api/app/slots", { ...manual, leadNumber: "10001" })).json();
  const dates = Object.keys(slots).sort();

  const inPerson = await postJson(page, "/api/app/bookings", { ...manual, leadNumber: "10001", date: dates[0], time: slots[dates[0]][0], forced: false, address: "רחוב הדוגמה 1" });
  expect((await inPerson.json()).teamsJoinUrl).toBeNull();

  await postJson(page, "/api/app/public/dev-stub", { noTeamsLink: true });
  const missing = await postJson(page, "/api/app/bookings", { ...manual, leadNumber: "10002", date: dates[1], time: slots[dates[1]][0], forced: false });
  await postJson(page, "/api/app/public/dev-stub", { noTeamsLink: false });
  const { id, teamsJoinUrl } = await missing.json();
  expect(teamsJoinUrl).toBeNull();
  const { data } = await admin().from("alerts").select("kind").eq("booking_id", id);
  expect(data).toEqual([{ kind: "no_teams_link" }]);
  await page.goto(`/admin/bookings/${id}`);
  await expect(page.getByText("אין קישור Teams")).toBeVisible();
});
