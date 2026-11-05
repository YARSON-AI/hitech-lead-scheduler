import { cronRoute } from "@/lib/http/cron";
import { adminClient } from "@/lib/supabase/admin";

export const GET = cronRoute(async () => {
  const { data, error } = await adminClient().rpc("run_retention");
  if (error) throw error;
  return data;
});
