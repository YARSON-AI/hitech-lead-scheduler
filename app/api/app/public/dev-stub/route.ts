import { NextResponse } from "next/server";
import { z } from "zod";
import { isProductionDeployment } from "@/lib/env/guard";
import { serverEnv } from "@/lib/env/server";
import { publicRoute } from "@/lib/http/route";
import { updateStubState } from "@/lib/integrations/stub-store";

const schema = z.strictObject({
  disconnect: z.string().email().optional(),
  reconnect: z.string().email().optional(),
  failNext: z.string().max(64).optional(),
  noTeamsLink: z.boolean().optional(),
});

export const POST = publicRoute({ schema }, async ({ body }) => {
  if (isProductionDeployment(process.env) || serverEnv().N8N_MODE !== "stub") {
    return new NextResponse(null, { status: 404 });
  }
  updateStubState((state) => {
    if (body.disconnect && !state.disconnected.includes(body.disconnect)) state.disconnected.push(body.disconnect);
    if (body.reconnect) state.disconnected = state.disconnected.filter((email) => email !== body.reconnect);
    if (body.failNext) state.failNext.push(body.failNext);
    if (body.noTeamsLink !== undefined) state.noTeamsLink = body.noTeamsLink;
  });
});
