export const DEV_SUPABASE_REF = "naehpbwtziqwjqubhpqc";

const LIVE_ONLY_VARS = [
  "AIRTABLE_API_TOKEN",
  "AIRTABLE_BASE_ID",
  "AIRTABLE_AGENTS_TABLE_ID",
  "AIRTABLE_SPECIALIZATIONS_TABLE_ID",
  "AIRTABLE_USERS_TABLE_ID",
  "AIRTABLE_MANUAL_ASSIGNMENT_DOCUMENTATION_TABLE_ID",
  "CALCOM_API_KEY",
  "CALCOM_TEAM_ID",
  "CALCOM_TEAM_SLUG",
  "N8N_API_KEY",
  "N8N_WEBHOOK_URL",
  "N8N_VALIDATE_LEADS_WEBHOOK_SECRET",
  "N8N_SPOUSE_MEETING_WEBHOOK_URL",
  "N8N_SPOUSE_MEETING_WEBHOOK_SECRET",
  "N8N_DELETE_ALLDAY_EVENT_WEBHOOK_URL",
  "N8N_DELETE_ALLDAY_EVENT_WEBHOOK_SECRET",
];

type Env = Record<string, string | undefined>;

export function isProductionDeployment(env: Env): boolean {
  return env.VERCEL === "1" && env.VERCEL_ENV === "production";
}

export function environmentProblems(env: Env): string[] {
  if (isProductionDeployment(env)) return [];

  const problems: string[] = [];
  const devHost = `${DEV_SUPABASE_REF}.supabase.co`;

  let host = "";
  try {
    host = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    host = "";
  }
  if (host !== devHost) {
    problems.push(`NEXT_PUBLIC_SUPABASE_URL must point at the dev/test project (${devHost})`);
  }

  if (env.SUPABASE_DB_URL && !env.SUPABASE_DB_URL.includes(DEV_SUPABASE_REF)) {
    problems.push("SUPABASE_DB_URL must point at the dev/test project");
  }

  for (const name of ["N8N_MODE", "AIRTABLE_MODE"]) {
    if (env[name] && env[name] !== "stub") problems.push(`${name} must be "stub" outside production`);
  }

  for (const name of LIVE_ONLY_VARS) {
    if (env[name]) problems.push(`${name} is a live-system key and must not be set outside production`);
  }

  return problems;
}

export function assertSafeEnvironment(env: Env = process.env): void {
  const problems = environmentProblems(env);
  if (problems.length > 0) {
    throw new Error(`Refusing to start:\n- ${problems.join("\n- ")}`);
  }
}

export function allowedOutboundHost(hostname: string): boolean {
  return (
    hostname === `${DEV_SUPABASE_REF}.supabase.co` ||
    hostname === "www.hebcal.com" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function guardedFetch(original: typeof fetch): typeof fetch {
  return (input, init) => {
    const raw = input instanceof Request ? input.url : String(input);
    const hostname = new URL(raw, "http://localhost").hostname;
    if (!allowedOutboundHost(hostname)) {
      return Promise.reject(new Error(`Blocked outbound call outside production: ${hostname}`));
    }
    return original(input, init);
  };
}
