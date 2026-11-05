import { redirect } from "next/navigation";
import { TwoStepScreen } from "@/components/screens/TwoStepScreen";
import { homeFor } from "@/lib/auth/types";
import { serverClient } from "@/lib/supabase/server";

export default async function TwoStepPage() {
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = user.app_metadata?.role;
  if (role !== "manager") redirect(role ? homeFor(role) : "/login");
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp?.find((factor) => factor.status === "verified");
  return <TwoStepScreen factorId={verified?.id ?? null} />;
}
