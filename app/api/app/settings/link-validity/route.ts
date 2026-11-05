import { z } from "zod";
import { MANAGER } from "@/lib/auth/types";
import { route } from "@/lib/http/route";
import { updateLinkValidity } from "@/lib/settings";

export const POST = route({ roles: MANAGER, schema: z.strictObject({ days: z.number() }) }, async ({ actor, body }) => {
  await updateLinkValidity(actor, body.days);
});
