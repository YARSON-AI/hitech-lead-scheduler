import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { notFound, route } from "@/lib/http/route";
import { adminClient } from "@/lib/supabase/admin";

export const POST = route({ roles: STAFF }, async ({ actor, params }) => {
  const { data, error } = await adminClient()
    .from("alerts")
    .update({ resolved_at: new Date().toISOString(), resolved_by: actor.id })
    .eq("id", z.string().uuid().parse(params.id))
    .is("resolved_at", null)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw notFound();
});
