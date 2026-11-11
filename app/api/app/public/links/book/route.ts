import { NextResponse } from "next/server";
import { z } from "zod";
import { bookThroughLink } from "@/lib/booking/links";
import { dateString, timeString } from "@/lib/booking/schemas";
import { publicRoute } from "@/lib/http/route";
import { limitPublic } from "@/lib/http/public-limit";

const schema = z.strictObject({ token: z.string().min(10).max(100), date: dateString, time: timeString });

export const POST = publicRoute({ schema, trace: "link.book" }, async ({ body, request }) => {
  await limitPublic(request, body.token, "book", 20, 10);
  const { row, proof } = await bookThroughLink(body.token, body.date, body.time);
  const response = NextResponse.json({ agentName: row.agent_name, start: row.start_at, end: row.end_at, online: !row.in_person_address });
  response.cookies.set("hti_booked", proof, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
});
