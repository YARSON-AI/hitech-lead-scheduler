export type BookingSystem = "calcom" | "engine";

export function bookingSystem(env: Record<string, string | undefined> = process.env): BookingSystem {
  return env.BOOKING_SYSTEM === "engine" ? "engine" : "calcom";
}
