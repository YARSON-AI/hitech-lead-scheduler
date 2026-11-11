import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL, locale: "he-IL", timezoneId: "Asia/Jerusalem" },
  webServer: { command: "npm run dev", url: `${baseURL}/login`, reuseExistingServer: true, timeout: 120000 },
  projects: [{ name: "desktop", use: { viewport: { width: 1360, height: 900 } } }],
});
