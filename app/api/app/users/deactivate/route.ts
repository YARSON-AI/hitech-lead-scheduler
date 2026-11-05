import { z } from "zod";
import { deactivate } from "@/lib/auth/accounts";
import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ userId: z.string().uuid() });

export const POST = route({ roles: MANAGER, schema }, async ({ actor, body }) => {
  await deactivate(actor, body.userId);
});
