import "server-only";
import { serverClient } from "@/lib/supabase/server";

export interface LinkListRow {
  id: string;
  lead_number: string;
  mode: "manual" | "auto";
  agent_email: string | null;
  agent_name: string | null;
  created_by_name: string;
  created_at: string;
  expires_at: string;
  status: "open" | "used" | "revoked";
}

export async function readLinks(): Promise<LinkListRow[]> {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("booking_links")
    .select("id, lead_number, mode, agent_email, agent_name, created_by_name, created_at, expires_at, status")
    .order("created_at", { ascending: false })
    .limit(300);
  return (data ?? []) as LinkListRow[];
}
