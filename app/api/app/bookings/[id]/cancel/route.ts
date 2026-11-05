import { z } from "zod";
import { cancel } from "@/lib/booking/actions";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ cancelledBy: z.enum(["customer", "agent", "coordinator"]), reason: z.string().trim().max(500).optional() });

export const POST = route({ roles: ["agent", "coordinator", "manager"], schema }, async ({ actor, body, params }) => {
  const row = await cancel(actor, z.string().uuid().parse(params.id), body.cancelledBy, body.reason);
  return { id: row.id };
});
