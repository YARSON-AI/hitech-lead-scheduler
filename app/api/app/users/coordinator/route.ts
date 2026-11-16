import { z } from "zod";
import { inviteCoordinator } from "@/lib/auth/accounts";
import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";

const schema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(2).max(80),
});

export const POST = route({ roles: MANAGER, schema }, async ({ actor, body, request }) => {
  return inviteCoordinator(actor, body.email, body.name, request.nextUrl.origin);
});
