import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { transferSlots } from "@/lib/booking/actions";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ agentId: z.string().min(1).max(64) });

export const POST = route({ roles: STAFF, schema, trace: "booking.transfer-slots" }, async ({ actor, body, params }) => {
  return transferSlots(actor, z.string().uuid().parse(params.id), body.agentId);
});
