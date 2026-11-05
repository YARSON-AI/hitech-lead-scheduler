import { fmtDate, fmtDow, fmtRange } from "./format";

export const CANCEL_BY_OPTIONS = [
  { value: "customer", label: "לבקשת הלקוח/ה", description: 'תגית בשורנס: בוטל ע"י לקוח' },
  { value: "agent", label: "לבקשת הסוכן/ת", description: 'תגית בשורנס: בוטל ע"י הסוכן' },
  { value: "coordinator", label: "לבקשת המתאמת", description: 'תגית בשורנס: בוטל ע"י המתאמת' },
];

export const whenText = (booking: { start_at: string; end_at: string }) => `${fmtDow(booking.start_at)} ● ${fmtDate(booking.start_at)}, ${fmtRange(booking.start_at, booking.end_at)}`;
