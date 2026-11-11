export type TrafficLight = "🟢" | "🟠" | "🔴";

export interface RosterAgent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  trafficLight?: TrafficLight;
  dailyQuota?: number;
  monthlyQuota?: number;
  weight?: number;
  weightLowered: boolean;
  monthlyCount: number;
  exclusions: Record<string, boolean>;
  blockedSince?: string;
  blockReason?: string;
}

export interface Specialization {
  id: string;
  name: string;
}

export interface ManualAssignmentEntry {
  bookedBy: string;
  agentName: string;
}

export interface Airtable {
  listAgents(): Promise<RosterAgent[]>;
  listSpecializations(): Promise<Specialization[]>;
  logManualAssignment(entry: ManualAssignmentEntry): Promise<void>;
}
