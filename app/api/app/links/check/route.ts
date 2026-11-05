import { z } from "zod";
import { validateLead } from "@/lib/booking/core";
import { leadNumber } from "@/lib/booking/schemas";
import { route } from "@/lib/http/route";

export const POST = route({ roles: ["agent", "coordinator", "manager"], schema: z.strictObject({ leadNumber }) }, async ({ body }) => {
  const lead = await validateLead(body.leadNumber);
  return { name: lead.fullName, number: lead.number };
});
