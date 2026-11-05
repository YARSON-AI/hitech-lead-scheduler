import "server-only";
import { ROSTER, SPECIALIZATIONS } from "../fixtures";
import { readStubState, updateStubState, writeOutbox } from "../stub-store";
import type { Airtable } from "./types";

export const stubAirtable: Airtable = {
  async listAgents() {
    const state = readStubState();
    return ROSTER.map((agent) => {
      const email = state.emailChanges[agent.email] ?? agent.email;
      return {
        ...agent,
        email,
        monthlyCount: agent.monthlyCount + (state.monthlyCounts[agent.id] ?? 0),
      };
    });
  },
  async listSpecializations() {
    return SPECIALIZATIONS;
  },
  async logManualAssignment(entry) {
    writeOutbox("airtable", "manual_assignment", entry);
    updateStubState((state) => {
      state.manualAssignments.push({ ...entry, at: new Date().toISOString() });
    });
  },
};
