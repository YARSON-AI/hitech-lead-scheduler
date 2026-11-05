import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { createBooking, resolveAssignment, validateLead } from "@/lib/booking/core";
import { assignmentSchema, dateString, timeString } from "@/lib/booking/schemas";
import { fromWall } from "@/lib/engine/time";
import { ApiError, hitRateLimit, route } from "@/lib/http/route";

const schema = z.strictObject({
  ...assignmentSchema,
  address: z.string().trim().max(300).optional(),
  date: dateString,
  time: timeString,
  forced: z.boolean(),
});

export const POST = route({ roles: STAFF, schema }, async ({ actor, body }) => {
  if (!(await hitRateLimit(`booking:${actor.id}`, 60, 60))) throw new ApiError(429, "rate_limited", "יותר מדי בקשות. נסה/י שוב בעוד דקה.");
  if (body.forced && body.mode !== "manual") throw new ApiError(400, "force_needs_agent", "קביעה כפויה דורשת בחירת סוכן/ת");
  const lead = await validateLead(body.leadNumber);
  const assignment = await resolveAssignment({ ...body, lead });
  const row = await createBooking({
    assignment,
    lead,
    start: fromWall(body.date, body.time),
    forced: body.forced,
    address: body.address,
    source: "staff",
    actor: { kind: "user", actor },
    bookedBy: actor.id,
    bookedByName: actor.name,
  });
  return {
    id: row.id,
    agentName: row.agent_name,
    customerName: row.customer_name,
    leadNumber: row.lead_number,
    start: row.start_at,
    end: row.end_at,
    address: row.in_person_address,
    teamsJoinUrl: row.teams_join_url,
  };
});
