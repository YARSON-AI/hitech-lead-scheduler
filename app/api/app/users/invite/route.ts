import { z } from "zod";
import { inviteAgent } from "@/lib/auth/accounts";
import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ rosterId: z.string().min(1).max(64) });

export const POST = route({ roles: MANAGER, schema }, async ({ actor, body, request }) => {
  return inviteAgent(actor, body.rosterId, request.nextUrl.origin);
});
