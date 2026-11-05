export type Role = "agent" | "coordinator" | "manager";

export interface Actor {
  id: string;
  email: string;
  name: string;
  role: Role;
  agentEmail: string | null;
  aal: "aal1" | "aal2";
}

export const STAFF: Role[] = ["coordinator", "manager"];
export const MANAGER: Role[] = ["manager"];
export const AGENT: Role[] = ["agent"];

export function homeFor(role: Role): string {
  return role === "agent" ? "/agent" : "/admin";
}

export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
