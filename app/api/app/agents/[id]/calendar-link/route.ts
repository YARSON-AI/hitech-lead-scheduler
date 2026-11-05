import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { sendCalendarLink } from "@/lib/booking/agents-admin";
import { route } from "@/lib/http/route";

export const POST = route({ roles: STAFF }, async ({ actor, params }) => {
  await sendCalendarLink(actor, z.string().min(1).max(64).parse(params.id));
});
