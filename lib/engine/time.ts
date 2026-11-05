export const TIME_ZONE = "Asia/Jerusalem";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export interface Wall {
  date: string;
  time: string;
  weekday: number;
  minutes: number;
}

function parts(instant: Date) {
  const map: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(instant)) map[part.type] = part.value;
  return map;
}

export function offsetMinutes(instant: Date): number {
  const p = parts(instant);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toWall(instant: Date): Wall {
  const p = parts(instant);
  const date = `${p.year}-${p.month}-${p.day}`;
  return {
    date,
    time: `${p.hour}:${p.minute}`,
    weekday: weekdayOf(date),
    minutes: +p.hour * 60 + +p.minute,
  };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fromWall(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const candidates = [offsetMinutes(new Date(guess - 180 * 60000)), offsetMinutes(new Date(guess + 180 * 60000))];
  const matches = candidates
    .map((offset) => new Date(guess - offset * 60000))
    .filter((instant) => {
      const wall = toWall(instant);
      return wall.date === date && wall.minutes === hh * 60 + mm;
    })
    .sort((a, b) => a.getTime() - b.getTime());
  if (matches.length > 0) return matches[0];
  return new Date(guess - Math.min(...candidates) * 60000);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function todayInJerusalem(now: Date = new Date()): string {
  return toWall(now).date;
}
