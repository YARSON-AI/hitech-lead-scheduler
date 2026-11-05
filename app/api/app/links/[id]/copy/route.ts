import { z } from "zod";
import { copyLink } from "@/lib/booking/links";
import { route } from "@/lib/http/route";

export const POST = route({ roles: ["agent", "coordinator", "manager"] }, async ({ actor, params, request }) => {
  return { url: await copyLink(actor, z.string().uuid().parse(params.id), request.nextUrl.origin) };
});
