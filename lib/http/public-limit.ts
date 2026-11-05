import "server-only";
import type { NextRequest } from "next/server";
import { hashLinkToken } from "@/lib/booking/link-token";
import { ApiError, clientIp, hitRateLimit } from "./route";

export async function limitPublic(request: NextRequest, token: string, scope: string, perIp: number, perToken: number): Promise<void> {
  const okIp = await hitRateLimit(`link-${scope}-ip:${clientIp(request)}`, perIp, 60);
  const okToken = await hitRateLimit(`link-${scope}-token:${hashLinkToken(token).slice(0, 32)}`, perToken, 60);
  if (!okIp || !okToken) throw new ApiError(429, "rate_limited", "יותר מדי בקשות. נסה/י שוב בעוד דקה.");
}
