import { z } from "zod";
import { reinvite } from "@/lib/auth/accounts";
import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ userId: z.string().uuid() });

export const POST = route({ roles: MANAGER, schema }, async ({ actor, body, request }) => {
  await reinvite(actor, body.userId, request.nextUrl.origin);
});
