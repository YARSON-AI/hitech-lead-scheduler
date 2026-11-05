import { execSync } from "node:child_process";

const SKIP = [/^package-lock\.json$/, /^\.env\.example$/, /^public\//];
const ALLOWED_EMAIL = /@(example\.test|example\.com|example\.org)$/i;

const SECRET_PATTERNS = [
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{8,}/],
  ["JWT", /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/],
  ["Airtable token", /\bpat[A-Za-z0-9]{14}\.[a-f0-9]{20,}/],
  ["Cal.com key", /\bcal_(live|test)_[a-f0-9]{16,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["database URL with password", /postgres(ql)?:\/\/[^:\s]+:[^@\s$]+@/],
  ["live n8n host", /srv1171769\.hstgr\.cloud/],
];

function validIsraeliId(id) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = Number(id[i]) * (i % 2 === 0 ? 1 : 2);
    sum += digit > 9 ? digit - 9 : digit;
  }
  return sum % 10 === 0;
}

const diff = execSync("git diff --cached --unified=0 --no-color --diff-filter=ACMR", { encoding: "utf8", maxBuffer: 1 << 28 });
const problems = [];
let file = "";
let skip = false;

for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    file = line.slice(6);
    skip = SKIP.some((pattern) => pattern.test(file));
    continue;
  }
  if (skip || !line.startsWith("+") || line.startsWith("+++")) continue;
  const text = line.slice(1);
  for (const [name, pattern] of SECRET_PATTERNS) {
    if (pattern.test(text)) problems.push(`${file}: ${name}`);
  }
  for (const match of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[A-Za-z]/g)) {
    if (!ALLOWED_EMAIL.test(match[0]) && !/^@/.test(match[0])) problems.push(`${file}: email address outside the test domains`);
  }
  for (const match of text.matchAll(/(?<![\d.-])05\d{8}(?!\d)/g)) {
    if (!/^05[02]0000\d{3}$/.test(match[0])) problems.push(`${file}: phone number`);
  }
  for (const match of text.matchAll(/(?<![\d.-])\d{9}(?!\d)/g)) {
    if (validIsraeliId(match[0])) problems.push(`${file}: possible ID number`);
  }
}

if (problems.length > 0) {
  console.error(`Commit blocked, possible secret or personal data:\n- ${[...new Set(problems)].join("\n- ")}`);
  process.exit(1);
}
