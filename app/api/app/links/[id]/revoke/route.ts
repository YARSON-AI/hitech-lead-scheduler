import { z } from "zod";
import { revokeLink } from "@/lib/booking/links";
import { route } from "@/lib/http/route";

export const POST = route({ roles: ["agent", "coordinator", "manager"] }, async ({ actor, params }) => {
  await revokeLink(actor, z.string().uuid().parse(params.id));
});
