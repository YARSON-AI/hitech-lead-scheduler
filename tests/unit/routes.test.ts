import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function routes(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routes(full);
    return entry.name === "route.ts" ? [full] : [];
  });
}

const PUBLIC = new Set([
  "app/api/app/auth/login/route.ts",
  "app/api/app/auth/logout/route.ts",
  "app/api/app/auth/set-password/route.ts",
  "app/api/app/public/links/view/route.ts",
  "app/api/app/public/links/slots/route.ts",
  "app/api/app/public/links/book/route.ts",
  "app/api/app/public/dev-stub/route.ts",
]);

describe("server routes", () => {
  const app = routes("app/api/app");

  it("every session route goes through the role wrapper, and public ones are listed", () => {
    for (const file of app) {
      const source = fs.readFileSync(file, "utf8");
      if (PUBLIC.has(file)) expect(source, file).toContain("publicRoute(");
      else expect(source, file).toMatch(/\broute\(\{ roles:/);
    }
  });

  it("every body schema rejects unknown fields", () => {
    for (const file of app) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/z\.object\(/);
    }
  });

  it("every cron route needs the secret", () => {
    for (const file of routes("app/api/cron")) {
      expect(fs.readFileSync(file, "utf8"), file).toContain("cronRoute(");
    }
  });
});
