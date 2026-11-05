import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { bookingSystem } from "@/lib/env/mode";

export function cronRoute(job: () => Promise<unknown>) {
  return async (request: NextRequest) => {
    if (bookingSystem() !== "engine") return new NextResponse(null, { status: 404 });
    const given = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${serverEnv().CRON_SECRET}`);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await job());
  };
}
