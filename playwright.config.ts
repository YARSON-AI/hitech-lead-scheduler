import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000", locale: "he-IL", timezoneId: "Asia/Jerusalem" },
  webServer: { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120000 },
  projects: [{ name: "desktop", use: { viewport: { width: 1360, height: 900 } } }],
});
