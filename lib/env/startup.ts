import { assertSafeEnvironment, guardedFetch, isProductionDeployment } from "./guard";

try {
  assertSafeEnvironment();
} catch (error) {
  console.error(String(error));
  process.exit(1);
}

if (!isProductionDeployment(process.env)) {
  globalThis.fetch = guardedFetch(globalThis.fetch);
}
