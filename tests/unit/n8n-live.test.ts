import { describe, expect, it } from "vitest";
import { parseResult, sign, verifySignature } from "@/lib/integrations/n8n/live";

const secret = "unit-test-secret-unit-test-secret";
const now = 1800000000;
const timestamp = String(now - 10);
const body = JSON.stringify({ ok: true, result: {} });
const signature = sign(secret, timestamp, body);

describe("gateway signature", () => {
  it("accepts a correct signature inside the time window", () => {
    expect(verifySignature(secret, timestamp, signature, body, now)).toBe(true);
  });

  it("rejects a changed body, a wrong secret, a stale timestamp and a missing header", () => {
    expect(verifySignature(secret, timestamp, signature, `${body} `, now)).toBe(false);
    expect(verifySignature(`${secret}x`, timestamp, signature, body, now)).toBe(false);
    expect(verifySignature(secret, timestamp, signature, body, now + 400)).toBe(false);
    expect(verifySignature(secret, null, signature, body, now)).toBe(false);
    expect(verifySignature(secret, timestamp, null, body, now)).toBe(false);
    expect(verifySignature(secret, timestamp, signature.slice(0, -2), body, now)).toBe(false);
  });
});

describe("gateway results", () => {
  const wrap = (result: unknown) => JSON.stringify({ ok: true, result });
  const calendar = { agentEmail: "a@example.test", readable: true, events: [{ eventId: "e1", start: "2026-11-08T07:00:00Z", end: "2026-11-08T07:30:00Z", showAs: "busy", subject: "x" }], meetingsPerDay: { "2026-11-08": 1 }, extra: 1 };

  it("returns calendars without unknown keys", () => {
    const { calendars } = parseResult("readCalendars", wrap({ calendars: [calendar], extra: true }));
    expect(calendars).toEqual([{ agentEmail: "a@example.test", readable: true, events: [{ eventId: "e1", start: "2026-11-08T07:00:00Z", end: "2026-11-08T07:30:00Z", showAs: "busy" }], meetingsPerDay: { "2026-11-08": 1 } }]);
  });

  it("returns the created event without unknown keys", () => {
    expect(parseResult("bookingCreated", wrap({ outlookEventId: "o1", surenseMeetingId: "s1", teamsJoinUrl: "https://teams.example.test/j", extra: 1 }))).toEqual({
      outlookEventId: "o1",
      surenseMeetingId: "s1",
      teamsJoinUrl: "https://teams.example.test/j",
    });
    expect(parseResult("bookingCreated", wrap({ outlookEventId: "o1", surenseMeetingId: "s1" })).teamsJoinUrl).toBeUndefined();
  });

  it("refuses an invalid or failed result", () => {
    expect(() => parseResult("readCalendars", wrap({ calendars: [{ ...calendar, readable: "yes" }] }))).toThrow();
    expect(() => parseResult("bookingCreated", wrap({ outlookEventId: "o1" }))).toThrow();
    expect(() => parseResult("bookingCreated", JSON.stringify({ ok: false, result: { outlookEventId: "o1", surenseMeetingId: "s1" } }))).toThrow();
    expect(() => parseResult("bookingCreated", "not json")).toThrow();
  });
});
