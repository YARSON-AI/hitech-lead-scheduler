import { z } from "zod";
import { STAFF } from "@/lib/auth/types";
import { resolveAssignment, validateLead } from "@/lib/booking/core";
import { leadNumber } from "@/lib/booking/schemas";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ leadNumber, spouseLeadNumber: leadNumber.optional() });

export const POST = route({ roles: STAFF, schema }, async ({ body }) => {
  const lead = await validateLead(body.leadNumber);
  if (!body.spouseLeadNumber) return { lead: { name: lead.fullName, number: lead.number } };
  const assignment = await resolveAssignment({ mode: "spouse", lead, spouseLeadNumber: body.spouseLeadNumber });
  return {
    lead: { name: lead.fullName, number: lead.number },
    spouse: { name: assignment.spouseLead!.fullName, number: assignment.spouseLead!.number },
  };
});
