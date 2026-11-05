import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ViteUserConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      "server-only": path.join(root, "tests/server-only-stub.ts"),
    },
  },
  test: {
    env: loadEnv("development", root, ""),
    include: ["tests/unit/**/*.test.ts", "tests/db/**/*.test.ts"],
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 60000,
  },
} as ViteUserConfig);
