import { spawnSync } from "node:child_process";
import { dbUrl } from "./lib";

const result = spawnSync("supabase", ["db", "push", "--db-url", dbUrl(), "--yes", ...process.argv.slice(2)], {
  stdio: ["ignore", "pipe", "pipe"],
  encoding: "utf8",
});
const scrub = (text: string) => text.replace(/(postgres(?:ql)?:\/\/[^:]+):[^@]*@/g, "$1:***@");
process.stdout.write(scrub(result.stdout ?? ""));
process.stderr.write(scrub(result.stderr ?? ""));
process.exit(result.status ?? 1);
