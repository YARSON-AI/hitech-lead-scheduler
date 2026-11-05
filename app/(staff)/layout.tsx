import type { ReactNode } from "react";
import { StaffShell } from "@/components/shell/StaffShell";
import { requirePage } from "@/lib/auth/actor";
import { STAFF } from "@/lib/auth/types";
import { bookingSystem } from "@/lib/env/mode";
import { serverClient } from "@/lib/supabase/server";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  if (bookingSystem() === "calcom") return <>{children}</>;
  const actor = await requirePage(STAFF);
  const supabase = await serverClient();
  const { count } = await supabase.from("alerts").select("id", { count: "exact", head: true }).is("resolved_at", null);
  return (
    <StaffShell userName={actor.name} isManager={actor.role === "manager"} alertCount={count ?? 0}>
      {children}
    </StaffShell>
  );
}
