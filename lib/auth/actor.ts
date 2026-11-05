import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverClient } from "@/lib/supabase/server";
import { homeFor, type Actor, type Role } from "./types";

export const currentActor = cache(async (): Promise<Actor | null> => {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role, agent_email, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.status !== "active" || profile.role !== user.app_metadata?.role) return null;
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    id: user.id,
    email: profile.email,
    name: profile.full_name,
    role: profile.role,
    agentEmail: profile.agent_email,
    aal: level?.currentLevel === "aal2" ? "aal2" : "aal1",
  };
});

export async function requirePage(roles: Role[]): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  if (actor.role === "manager" && actor.aal !== "aal2") redirect("/login/two-step");
  if (!roles.includes(actor.role)) redirect(homeFor(actor.role));
  return actor;
}
