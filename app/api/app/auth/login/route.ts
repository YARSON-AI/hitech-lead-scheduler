import { z } from "zod";
import { homeFor, type Role } from "@/lib/auth/types";
import { ApiError, clientIp, hitRateLimit, publicRoute } from "@/lib/http/route";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";

const schema = z.strictObject({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) });

const wrong = () => new ApiError(401, "wrong_credentials", "מייל או סיסמה שגויים");

export const POST = publicRoute({ schema }, async ({ body, request }) => {
  const key = `login:${body.email}`;
  if (!(await hitRateLimit(`login-ip:${clientIp(request)}`, 200, 300))) throw new ApiError(429, "locked", "");
  if (!(await hitRateLimit(key, 5, 300))) throw new ApiError(429, "locked", "");

  const supabase = await serverClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
  if (error || !data.user) throw wrong();

  const { data: profile } = await supabase.from("profiles").select("status, role").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    throw wrong();
  }
  await adminClient().rpc("clear_rate_limit", { p_key: key });
  const role = profile.role as Role;
  return { next: role === "manager" ? "/login/two-step" : homeFor(role) };
});
