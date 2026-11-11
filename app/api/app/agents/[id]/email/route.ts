import { z } from "zod";
import { MANAGER } from "@/lib/auth/types";
import { changeAgentEmail } from "@/lib/booking/agents-admin";
import { route } from "@/lib/http/route";

const schema = z.strictObject({ email: z.string().trim().toLowerCase().email().max(254) });

export const POST = route({ roles: MANAGER, schema, trace: "agent.email" }, async ({ actor, body, params }) => {
  await changeAgentEmail(actor, z.string().min(1).max(64).parse(params.id), body.email);
});
