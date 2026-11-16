import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { serverClient } from "@/lib/supabase/server";
import { homeFor, type Actor, type Role } from "./types";

export const currentActor = cache(async (): Promise<Actor | null> => {
  const supabase = await serverClient();
  const { data: verified } = await supabase.auth.getClaims();
  const claims = verified?.claims;
  if (!claims) return null;
  const [
    {
      data: { user },
    },
    { data: profile },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("email, full_name, role, agent_email, status").eq("id", claims.sub).maybeSingle(),
  ]);
  if (!user || user.id !== claims.sub) return null;
  if (!profile || profile.status !== "active" || profile.role !== user.app_metadata?.role) return null;
  return {
    id: user.id,
    email: profile.email,
    name: profile.full_name,
    role: profile.role,
    agentEmail: profile.agent_email,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
  };
});

export async function requirePage(roles: Role[]): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  if (actor.role === "manager" && actor.aal !== "aal2") redirect("/login/two-step");
  if (!roles.includes(actor.role)) redirect(homeFor(actor.role));
  return actor;
}
