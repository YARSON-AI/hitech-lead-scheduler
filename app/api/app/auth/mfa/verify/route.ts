import { z } from "zod";
import { MANAGER } from "@/lib/auth/types";
import { ApiError, hitRateLimit, route } from "@/lib/http/route";
import { serverClient } from "@/lib/supabase/server";

const schema = z.strictObject({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) });

export const POST = route({ roles: MANAGER, allowAal1: true, schema }, async ({ actor, body }) => {
  if (!(await hitRateLimit(`mfa:${actor.id}`, 10, 300))) {
    throw new ApiError(429, "rate_limited", "יותר מדי ניסיונות. נסה/י שוב בעוד מספר דקות.");
  }
  const supabase = await serverClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: body.factorId, code: body.code });
  if (error) throw new ApiError(400, "wrong_code", "הקוד שגוי. נסה/י שוב.");
});
