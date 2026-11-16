import { expect, test } from "@playwright/test";
import { admin, AGENT, COORDINATOR, D, fillLogin, login, loginManager, MANAGER, postJson, linkInOutbox, removeUser, userByEmail, waitForLink } from "./helpers";

const NEW_AGENT = `neta@${D}`;
const NEW_COORD = `e2e-coord@${D}`;
const NEW_PASSWORD = "NewPassword1x";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await removeUser(NEW_AGENT);
  await removeUser(NEW_COORD);
});

test("an agent reaches only the agent area", async ({ page }) => {
  await login(page, AGENT);
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/agent$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/agent$/);
  expect((await postJson(page, "/api/app/users/coordinator", { email: `x@${D}` })).status()).toBe(403);
});

test("a coordinator reaches staff but no manager area", async ({ page }) => {
  await login(page, COORDINATOR);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/agent");
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin$/);
  expect((await postJson(page, "/api/app/users/coordinator", { email: `x@${D}` })).status()).toBe(403);
});

test("a manager without the second step reaches nothing", async ({ page }) => {
  await login(page, MANAGER);
  await page.waitForURL("**/login/two-step");
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/two-step/);
  expect((await postJson(page, "/api/app/users/coordinator", { email: `x@${D}` })).status()).toBe(403);
});

test("wrong password shows an error and five failures lock the sign-in", async ({ page }) => {
  const email = `coordinator2@${D}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    await fillLogin(page, email, "wrong-password-1A");
    await expect(page).toHaveURL(/\/login$/);
  }
  await fillLogin(page, email, "wrong-password-1A");
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await admin().rpc("clear_rate_limit", { p_key: `login:${email}` });
});

test("invite, set password, sign in, reset, deactivate", async ({ page, browser }) => {
  await loginManager(page);
  await page.goto("/admin/users");
  const row = page.locator("tr", { hasText: NEW_AGENT });
  const stale = linkInOutbox(NEW_AGENT);
  await row.locator("button").first().click();

  const agentContext = await browser.newContext();
  const agent = await agentContext.newPage();
  const link = await waitForLink(NEW_AGENT, stale);

  await agent.goto(link);
  const inputs = agent.locator('input[type="password"]');
  await inputs.nth(0).fill("short");
  await inputs.nth(1).fill("short");
  await agent.locator('button[type="submit"]').click();
  await expect(agent).toHaveURL(/set-password/);

  const weak = await postJson(agent, "/api/app/auth/set-password", { token: new URL(link).searchParams.get("t"), password: "alllowercase1" });
  expect(weak.status()).toBe(400);

  await inputs.nth(0).fill(NEW_PASSWORD);
  await inputs.nth(1).fill(NEW_PASSWORD);
  await agent.locator('button[type="submit"]').click();
  await expect(inputs).toHaveCount(0);

  await agent.goto(link);
  await expect(agent.locator('input[type="password"]')).toHaveCount(0);

  await login(agent, NEW_AGENT, NEW_PASSWORD);
  await expect(agent).toHaveURL(/\/agent$/);

  await page.reload();
  await row.getByRole("button", { name: "השבתה" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "השבתה" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await agent.goto("/agent/hours");
  await expect(agent).toHaveURL(/\/login/);
  await fillLogin(agent, NEW_AGENT, NEW_PASSWORD);
  await expect(agent).toHaveURL(/\/login$/);

  await page.reload();
  await row.locator("button").first().click();
  const again = await waitForLink(NEW_AGENT, link);
  await agent.goto(again);
  await agent.locator('input[type="password"]').nth(0).fill("AnotherPass12");
  await agent.locator('input[type="password"]').nth(1).fill("AnotherPass12");
  await agent.locator('button[type="submit"]').click();
  await expect(agent.locator('input[type="password"]')).toHaveCount(0);
  await login(agent, NEW_AGENT, "AnotherPass12");
  await expect(agent).toHaveURL(/\/agent$/);
  await agentContext.close();
});

test("a manager adds a coordinator by email", async ({ page, browser }) => {
  await loginManager(page);
  await page.goto("/admin/users");
  const staleCoord = linkInOutbox(NEW_COORD);
  await page.locator("main").locator("button").first().click();
  await page.getByRole("dialog").locator("input").nth(0).fill("E2E Coordinator");
  await page.getByRole("dialog").locator("input").nth(1).fill(NEW_COORD);
  await page.getByRole("dialog").getByRole("button", { name: "שליחת הזמנה" }).click();
  await expect(page.locator("tr", { hasText: NEW_COORD })).toBeVisible();

  const context = await browser.newContext();
  const coordinator = await context.newPage();
  await coordinator.goto(await waitForLink(NEW_COORD, staleCoord));
  await coordinator.locator('input[type="password"]').nth(0).fill(NEW_PASSWORD);
  await coordinator.locator('input[type="password"]').nth(1).fill(NEW_PASSWORD);
  await coordinator.locator('button[type="submit"]').click();
  await expect(coordinator.locator('input[type="password"]')).toHaveCount(0);
  await login(coordinator, NEW_COORD, NEW_PASSWORD);
  await expect(coordinator).toHaveURL(/\/admin$/);
  expect(await userByEmail(NEW_COORD)).not.toBeNull();
  await context.close();
});
