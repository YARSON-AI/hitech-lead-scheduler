import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { transfer } from "@/lib/booking/actions";
import { dateString, timeString } from "@/lib/booking/schemas";
import { fromWall } from "@/lib/engine/time";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ agentId: z.string().min(1).max(64), date: dateString, time: timeString, forced: z.boolean() });

export const POST = route({ roles: STAFF, schema }, async ({ actor, body, params }) => {
  const row = await transfer(actor, z.string().uuid().parse(params.id), body.agentId, fromWall(body.date, body.time).toISOString(), body.forced);
  return { id: row.id };
});
