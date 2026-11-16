import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { resolveAssignment, slotsForAssignment, validateLead } from "@/lib/booking/core";
import { assignmentSchema } from "@/lib/booking/schemas";
import { loadSettings } from "@/lib/booking/availability";
import { route } from "@/lib/http/route";
import { airtable } from "@/lib/integrations/airtable";

const schema = z.strictObject(assignmentSchema);

export const POST = route({ roles: STAFF, schema, trace: "slots" }, async ({ body }) => {
  const [lead, roster] = await Promise.all([validateLead(body.leadNumber, true), airtable().listAgents()]);
  const assignment = await resolveAssignment({ ...body, lead, roster, reuseLeads: true });
  const [slots, settings] = await Promise.all([slotsForAssignment(assignment), loadSettings(assignment.query.profile)]);
  return { slots, durationMin: settings.durationMin, windowDays: settings.windowDays };
});
