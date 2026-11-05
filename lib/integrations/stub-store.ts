import "server-only";
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), ".stub-state");
const STATE_FILE = path.join(DIR, "state.json");
const OUTBOX_FILE = path.join(DIR, "outbox.jsonl");

export interface StubState {
  monthlyCounts: Record<string, number>;
  emailChanges: Record<string, string>;
  disconnected: string[];
  failNext: string[];
  noTeamsLink: boolean;
  manualAssignments: { bookedBy: string; agentName: string; at: string }[];
}

const EMPTY: StubState = {
  monthlyCounts: {},
  emailChanges: {},
  disconnected: [],
  failNext: [],
  noTeamsLink: false,
  manualAssignments: [],
};

export function readStubState(): StubState {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return { ...EMPTY };
  }
}

export function updateStubState(change: (state: StubState) => void): StubState {
  const state = readStubState();
  change(state);
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

export interface OutboxEntry {
  at: string;
  channel: "n8n" | "airtable" | "email";
  event: string;
  payload: unknown;
}

export function writeOutbox(channel: OutboxEntry["channel"], event: string, payload: unknown): void {
  fs.mkdirSync(DIR, { recursive: true });
  const entry: OutboxEntry = { at: new Date().toISOString(), channel, event, payload };
  fs.appendFileSync(OUTBOX_FILE, `${JSON.stringify(entry)}\n`);
}

export function readOutbox(limit = 200): OutboxEntry[] {
  try {
    const lines = fs.readFileSync(OUTBOX_FILE, "utf8").trim().split("\n").filter(Boolean);
    return lines.slice(-limit).reverse().map((line) => JSON.parse(line) as OutboxEntry);
  } catch {
    return [];
  }
}

export function clearStubFiles(): void {
  fs.rmSync(DIR, { recursive: true, force: true });
}
