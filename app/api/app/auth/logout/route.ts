import { publicRoute } from "@/lib/http/route";
import { serverClient } from "@/lib/supabase/server";

export const POST = publicRoute({}, async () => {
  const supabase = await serverClient();
  await supabase.auth.signOut();
});
