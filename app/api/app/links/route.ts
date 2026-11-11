import { z } from "zod";
import { createLink } from "@/lib/booking/links";
import { leadNumber } from "@/lib/booking/schemas";
import { route } from "@/lib/http/route";

const schema = z.strictObject({
  leadNumber,
  address: z.string().trim().max(300).optional(),
  mode: z.enum(["manual", "auto"]),
  agentId: z.string().max(64).optional(),
  specialization: z.string().max(100).optional(),
});

export const POST = route({ roles: ["agent", "coordinator", "manager"], schema, trace: "link.create" }, async ({ actor, body, request }) => {
  return createLink(actor, body, request.nextUrl.origin);
});
