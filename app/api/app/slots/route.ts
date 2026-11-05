import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { resolveAssignment, slotsForAssignment, validateLead } from "@/lib/booking/core";
import { assignmentSchema } from "@/lib/booking/schemas";
import { loadSettings } from "@/lib/booking/availability";
import { route } from "@/lib/http/route";

const schema = z.strictObject(assignmentSchema);

export const POST = route({ roles: STAFF, schema }, async ({ body }) => {
  const lead = await validateLead(body.leadNumber);
  const assignment = await resolveAssignment({ ...body, lead });
  const [slots, settings] = await Promise.all([slotsForAssignment(assignment), loadSettings(assignment.query.profile)]);
  return { slots, durationMin: settings.durationMin, windowDays: settings.windowDays };
});
