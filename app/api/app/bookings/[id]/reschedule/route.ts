import { z } from "zod";
import { reschedule } from "@/lib/booking/actions";
import { dateString, timeString } from "@/lib/booking/schemas";
import { fromWall } from "@/lib/engine/time";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ date: dateString, time: timeString, forced: z.boolean() });

export const POST = route({ roles: ["agent", "coordinator", "manager"], schema, trace: "booking.reschedule" }, async ({ actor, body, params }) => {
  const row = await reschedule(actor, z.string().uuid().parse(params.id), fromWall(body.date, body.time).toISOString(), body.forced);
  return { id: row.id };
});
