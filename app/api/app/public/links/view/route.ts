import { NextResponse } from "next/server";
import { z } from "zod";
import { viewLink } from "@/lib/booking/links";
import { publicRoute } from "@/lib/http/route";
import { limitPublic } from "@/lib/http/public-limit";

const schema = z.strictObject({ token: z.string().min(10).max(100) });

export const POST = publicRoute({ schema }, async ({ body, request }) => {
  await limitPublic(request, body.token, "view", 60, 30);
  const view = await viewLink(body.token, request.cookies.get("hti_booked")?.value);
  return NextResponse.json(view, { headers: { "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" } });
});
