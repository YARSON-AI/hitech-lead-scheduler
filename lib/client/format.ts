const TZ = "Asia/Jerusalem";

const partsOf = (iso: string) => {
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso))) {
    map[part.type] = part.value;
  }
  return map;
};

export const fmtDate = (iso: string) => {
  const p = partsOf(iso);
  return `${p.day}.${p.month}.${p.year}`;
};

export const fmtTime = (iso: string) => {
  const p = partsOf(iso);
  return `${p.hour}:${p.minute}`;
};

export const fmtRange = (start: string, end: string) => `${fmtTime(start)} - ${fmtTime(end)}`;

export const fmtDow = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long" }).format(new Date(iso));

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const localDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const dotted = (date: string) => date.split("-").reverse().join(".");

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
