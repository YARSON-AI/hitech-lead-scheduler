import { describe, expect, it } from "vitest";
import { allowedOutboundHost, environmentProblems, guardedFetch } from "@/lib/env/guard";

const dev = { NEXT_PUBLIC_SUPABASE_URL: "https://naehpbwtziqwjqubhpqc.supabase.co" };

describe("environment guard", () => {
  it("accepts the dev project", () => {
    expect(environmentProblems(dev)).toEqual([]);
  });

  it("refuses any other database", () => {
    expect(environmentProblems({ NEXT_PUBLIC_SUPABASE_URL: "https://otherproject.supabase.co" })).not.toEqual([]);
    expect(environmentProblems({})).not.toEqual([]);
    expect(environmentProblems({ ...dev, SUPABASE_DB_URL: "postgresql://elsewhere/postgres" })).not.toEqual([]);
  });

  it("refuses a look-alike host", () => {
    expect(environmentProblems({ NEXT_PUBLIC_SUPABASE_URL: "https://naehpbwtziqwjqubhpqc.supabase.co.evil.test" })).not.toEqual([]);
  });

  it("refuses live integrations and live keys outside production", () => {
    expect(environmentProblems({ ...dev, N8N_MODE: "live" })).not.toEqual([]);
    expect(environmentProblems({ ...dev, AIRTABLE_MODE: "live" })).not.toEqual([]);
    expect(environmentProblems({ ...dev, AIRTABLE_API_TOKEN: "x" })).not.toEqual([]);
    expect(environmentProblems({ ...dev, CALCOM_API_KEY: "x" })).not.toEqual([]);
    expect(environmentProblems({ ...dev, N8N_GATEWAY_URL: "https://n8n.example.test/webhook/x" })).not.toEqual([]);
    expect(environmentProblems({ ...dev, N8N_GATEWAY_SECRET: "x" })).not.toEqual([]);
  });

  it("only a real Vercel production deployment is exempt", () => {
    expect(environmentProblems({ VERCEL: "1", VERCEL_ENV: "production" })).toEqual([]);
    expect(environmentProblems({ VERCEL_ENV: "production" })).not.toEqual([]);
    expect(environmentProblems({ VERCEL: "1", VERCEL_ENV: "preview" })).not.toEqual([]);
  });
});

describe("outbound guard", () => {
  it("allows only the dev project, Hebcal and localhost", () => {
    expect(allowedOutboundHost("naehpbwtziqwjqubhpqc.supabase.co")).toBe(true);
    expect(allowedOutboundHost("www.hebcal.com")).toBe(true);
    expect(allowedOutboundHost("api.airtable.com")).toBe(false);
    expect(allowedOutboundHost("api.cal.com")).toBe(false);
    expect(allowedOutboundHost("graph.microsoft.com")).toBe(false);
  });

  it("blocks a call to a live service", async () => {
    const calls: unknown[] = [];
    const wrapped = guardedFetch((async (input: unknown) => {
      calls.push(input);
      return new Response("ok");
    }) as typeof fetch);
    await expect(wrapped("https://api.airtable.com/v0/x")).rejects.toThrow();
    await expect(wrapped("https://www.hebcal.com/hebcal")).resolves.toBeInstanceOf(Response);
    expect(calls).toHaveLength(1);
  });
});
