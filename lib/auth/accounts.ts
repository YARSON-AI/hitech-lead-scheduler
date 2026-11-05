import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { airtable } from "@/lib/integrations/airtable";
import { n8n } from "@/lib/integrations/n8n";
import { adminClient } from "@/lib/supabase/admin";
import { ApiError, notFound } from "@/lib/http/route";
import type { Actor, Role } from "./types";

const INVITE_DAYS = 7;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const randomPassword = () => `Aa1${randomBytes(32).toString("base64url")}`;

export type AccountStatus = "none" | "invited" | "active" | "deactivated";

export interface UserRow {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  kind: Role;
  status: AccountStatus;
  self: boolean;
}

export async function listUsers(actor: Actor): Promise<UserRow[]> {
  const [{ data: profiles, error }, roster] = await Promise.all([
    adminClient().from("profiles").select("id, email, full_name, role, agent_email, status"),
    airtable().listAgents(),
  ]);
  if (error) throw error;
  const byEmail = new Map((profiles ?? []).map((profile) => [profile.email, profile]));
  const rows: UserRow[] = roster.map((agent) => {
    const profile = byEmail.get(agent.email);
    return {
      id: profile?.id ?? agent.id,
      userId: profile?.id ?? null,
      name: agent.name,
      email: agent.email,
      kind: "agent",
      status: profile?.status ?? "none",
      self: false,
    };
  });
  for (const profile of profiles ?? []) {
    if (profile.role === "agent") continue;
    rows.push({
      id: profile.id,
      userId: profile.id,
      name: profile.full_name,
      email: profile.email,
      kind: profile.role,
      status: profile.status,
      self: profile.id === actor.id,
    });
  }
  return rows;
}

async function audit(actor: Actor | null, targetEmail: string, action: string, details?: Record<string, unknown>) {
  const { error } = await adminClient()
    .from("account_events")
    .insert({ target_email: targetEmail, action, actor_user: actor?.id, actor_name: actor?.name, details });
  if (error) throw error;
}

async function issueLink(actor: Actor, userId: string, email: string, name: string, origin: string, kind: "invite" | "reinvite") {
  const db = adminClient();
  const token = randomBytes(32).toString("base64url");
  await db.from("account_invites").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId).is("used_at", null).is("revoked_at", null);
  const { error } = await db.from("account_invites").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + INVITE_DAYS * 86400000).toISOString(),
  });
  if (error) throw error;
  await n8n().sendAccountLink({ to: email, name, link: `${origin}/set-password?t=${token}`, kind });
  await audit(actor, email, kind === "invite" ? "invited" : "reinvited");
}

async function createAccount(email: string, role: Role, name: string, agentEmail: string | null, actor: Actor): Promise<string> {
  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: randomPassword(),
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) {
    if (error.status === 422 || error.code === "email_exists") {
      throw new ApiError(409, "email_taken", "כתובת המייל כבר משויכת למשתמש אחר");
    }
    throw error;
  }
  const { error: profileError } = await db.from("profiles").insert({
    id: data.user.id,
    email,
    role,
    full_name: name,
    agent_email: agentEmail,
    status: "invited",
    invited_at: new Date().toISOString(),
    invited_by: actor.id,
  });
  if (profileError) {
    await db.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
  return data.user.id;
}

export async function inviteAgent(actor: Actor, rosterId: string, origin: string): Promise<UserRow> {
  const roster = await airtable().listAgents();
  const agent = roster.find((row) => row.id === rosterId);
  if (!agent) throw notFound();
  const userId = await createAccount(agent.email, "agent", agent.name, agent.email, actor);
  await issueLink(actor, userId, agent.email, agent.name, origin, "invite");
  return { id: userId, userId, name: agent.name, email: agent.email, kind: "agent", status: "invited", self: false };
}

export async function inviteCoordinator(actor: Actor, email: string, origin: string): Promise<UserRow> {
  const name = email.split("@")[0];
  const userId = await createAccount(email, "coordinator", name, null, actor);
  await issueLink(actor, userId, email, name, origin, "invite");
  return { id: userId, userId, name, email, kind: "coordinator", status: "invited", self: false };
}

export async function reinvite(actor: Actor, userId: string, origin: string): Promise<void> {
  const db = adminClient();
  const { data: profile } = await db.from("profiles").select("email, full_name, status").eq("id", userId).maybeSingle();
  if (!profile) throw notFound();
  if (profile.status !== "active") {
    await db.from("profiles").update({ status: "invited", invited_at: new Date().toISOString(), invited_by: actor.id }).eq("id", userId);
  }
  await issueLink(actor, userId, profile.email, profile.full_name, origin, "reinvite");
}

export async function deactivate(actor: Actor, userId: string): Promise<void> {
  if (userId === actor.id) throw new ApiError(400, "self", "לא ניתן להשבית את החשבון שלך");
  const db = adminClient();
  const { data: profile } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (!profile) throw notFound();
  const { error: profileError } = await db
    .from("profiles")
    .update({ status: "deactivated", deactivated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileError) throw profileError;
  const { error } = await db.auth.admin.updateUserById(userId, { ban_duration: "87600h" });
  if (error) throw error;
  const { error: sessionsError } = await db.rpc("end_user_sessions", { p_user: userId });
  if (sessionsError) throw sessionsError;
  await db.from("account_invites").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId).is("used_at", null).is("revoked_at", null);
  await audit(actor, profile.email, "deactivated");
}

export async function inviteIsOpen(token: string): Promise<{ email: string } | null> {
  const db = adminClient();
  const { data: invite } = await db
    .from("account_invites")
    .select("user_id, expires_at, used_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!invite || invite.used_at || invite.revoked_at || new Date(invite.expires_at) < new Date()) return null;
  const { data: profile } = await db.from("profiles").select("email").eq("id", invite.user_id).maybeSingle();
  return profile ? { email: profile.email } : null;
}

export async function setPasswordWithToken(token: string, password: string): Promise<boolean> {
  const db = adminClient();
  const { data: invite } = await db
    .from("account_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .maybeSingle();
  if (!invite) return false;
  const { error } = await db.auth.admin.updateUserById(invite.user_id, { password, ban_duration: "none" });
  if (error) throw error;
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .update({ status: "active", activated_at: new Date().toISOString(), deactivated_at: null })
    .eq("id", invite.user_id)
    .select("email")
    .single();
  if (profileError) throw profileError;
  await audit(null, profile.email, "password_set");
  return true;
}
