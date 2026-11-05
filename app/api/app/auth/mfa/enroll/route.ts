import { MANAGER } from "@/lib/auth/types";
import { ApiError, route } from "@/lib/http/route";
import { serverClient } from "@/lib/supabase/server";

export const POST = route({ roles: MANAGER, allowAal1: true }, async () => {
  const supabase = await serverClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp?.some((factor) => factor.status === "verified")) {
    throw new ApiError(409, "already_enrolled", "האימות הדו-שלבי כבר הוגדר");
  }
  for (const factor of factors?.all ?? []) {
    if (factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `hitech-${Date.now()}` });
  if (error) throw error;
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
});
