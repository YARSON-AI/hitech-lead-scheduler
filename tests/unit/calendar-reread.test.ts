import { describe, expect, it } from "vitest";
import { readConfirmed } from "@/lib/booking/availability";
import type { AgentCalendar } from "@/lib/integrations/n8n/types";

const calendar = (agentEmail: string, readable: boolean): AgentCalendar => ({ agentEmail, readable, events: [], meetingsPerDay: {} });

function reader(answers: Record<string, boolean>[]) {
  const calls: string[][] = [];
  const read = async (emails: string[]) => {
    const answer = answers[calls.length];
    calls.push(emails);
    return emails.map((email) => calendar(email, answer[email]));
  };
  return { calls, read };
}

describe("unreadable calendars", () => {
  it("reads a connected agent's calendar once more before believing it is unreadable", async () => {
    const { calls, read } = reader([{ "a@example.test": true, "b@example.test": false, "c@example.test": false, "d@example.test": false }, { "b@example.test": true, "c@example.test": false }]);
    const wasConnected = new Map([["a@example.test", true], ["b@example.test", true], ["d@example.test", false]]);
    const result = await readConfirmed(read, ["a@example.test", "b@example.test", "c@example.test", "d@example.test"], wasConnected);
    expect(calls).toEqual([["a@example.test", "b@example.test", "c@example.test", "d@example.test"], ["b@example.test", "c@example.test"]]);
    expect(result.map((row) => row.readable)).toEqual([true, true, false, false]);
  });

  it("does not read again when nothing changed", async () => {
    const { calls, read } = reader([{ "a@example.test": true, "d@example.test": false }]);
    await readConfirmed(read, ["a@example.test", "d@example.test"], new Map([["d@example.test", false]]));
    expect(calls).toHaveLength(1);
  });
});
