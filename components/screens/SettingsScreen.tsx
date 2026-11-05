"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ds";
import { Glyph, QuietButton } from "@/components/views/bits";
import { DateField } from "@/components/views/pickers";
import { HolDelOpen5 } from "@/components/views/staff/dialogs/HolDelOpen5";
import { HolDlgOpen4 } from "@/components/views/staff/dialogs/HolDlgOpen4";
import { SettingsView } from "@/components/views/staff/SettingsView";
import { useToast } from "@/components/shell/ToastProvider";
import { api, ApiFailure } from "@/lib/client/api";
import { dotted, fmtDate, fmtTime, isoDate, localDate } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";

type Change = { target: { value: string } };

interface Profile {
  profile: "regular" | "spouse";
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  notice_min: number;
  window_days: number;
  interval_min: number;
}

interface HolidayRecord {
  date: string;
  name: string;
  kind: "yomtov" | "erev" | "chol_hamoed" | "modern" | "other";
  blocks: boolean;
  blocked_from: string | null;
  blocked_to: string | null;
  source: "hebcal" | "manager";
  manager_edited: boolean;
  range_id: string | null;
}

interface HistoryRecord {
  id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string;
  changed_at: string;
}

const FIELDS: { key: keyof Omit<Profile, "profile">; label: string; hint: string; unit: string }[] = [
  { key: "duration_min", label: "משך הפגישה", hint: "כמה זמן הפגישה תופסת ביומן", unit: "דקות" },
  { key: "buffer_before_min", label: "מרווח לפני", hint: "זמן חסום לפני הפגישה", unit: "דקות" },
  { key: "buffer_after_min", label: "מרווח אחרי", hint: "זמן חסום אחרי הפגישה", unit: "דקות" },
  { key: "notice_min", label: "התראה מוקדמת", hint: "המועד הקרוב ביותר שניתן לתאם", unit: "דקות" },
  { key: "window_days", label: "חלון תיאום", hint: "כמה ימים קדימה ניתן לתאם", unit: "ימים" },
  { key: "interval_min", label: "מרווח בין מועדים", hint: "כל כמה דקות מוצע מועד פנוי חדש", unit: "דקות" },
];

const TYPES: Record<HolidayRecord["kind"], [string, string]> = {
  yomtov: ["warning", "חג"],
  erev: ["neutral", "ערב חג"],
  chol_hamoed: ["info", "חול המועד"],
  modern: ["brand", "יום לאומי"],
  other: ["purple", "אחר"],
};

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const DOWS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "יום שבת"];

const SOURCE_GLYPH = {
  auto: ['<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>', "אוטומטי", "var(--text-tertiary)", "נטען מלוח החגים"],
  changed: ['<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>', "שונה ידנית", "var(--amber-600)", "יום מלוח החגים ששונה ידנית"],
  added: ['<path d="M5 12h14"/><path d="M12 5v14"/>', "נוסף ידנית", "var(--teal-700)", "יום חופש שנוסף ידנית"],
} as const;

const TRASH = '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>';
const LINK = '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';

interface Entry {
  id: string;
  from: string;
  to: string;
  days: number;
  name: string;
  kind: HolidayRecord["kind"];
  blocks: boolean;
  blockedFrom: string | null;
  blockedTo: string | null;
  source: "auto" | "changed" | "added";
  isRange: boolean;
}

function entries(rows: HolidayRecord[]): Entry[] {
  const out: Entry[] = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (row.range_id && last?.isRange && last.id === row.range_id) {
      last.to = row.date;
      last.days += 1;
      continue;
    }
    out.push({
      id: row.range_id ?? row.date,
      from: row.date,
      to: row.date,
      days: 1,
      name: row.name,
      kind: row.kind,
      blocks: row.blocks,
      blockedFrom: row.blocked_from?.slice(0, 5) ?? null,
      blockedTo: row.blocked_to?.slice(0, 5) ?? null,
      source: row.source === "manager" ? "added" : row.manager_edited ? "changed" : "auto",
      isRange: !!row.range_id,
    });
  }
  return out;
}

export function SettingsScreen({
  profiles,
  linkDays,
  holidays,
  history,
  year,
  firstYear,
  lastYear,
}: {
  profiles: Profile[];
  linkDays: number;
  holidays: HolidayRecord[];
  history: HistoryRecord[];
  year: number;
  firstYear: number;
  lastYear: number;
}) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const common = useCommonVM();
  const initial = (profile: Profile) => Object.fromEntries(FIELDS.map((field) => [field.key, String(profile[field.key])]));
  const regular = profiles.find((row) => row.profile === "regular")!;
  const spouse = profiles.find((row) => row.profile === "spouse")!;
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({ regular: initial(regular), spouse: initial(spouse) });
  const [link, setLink] = useState(String(linkDays));

  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isBlocked, setIsBlocked] = useState(true);
  const [allDay, setAllDay] = useState(true);
  const [hourFrom, setHourFrom] = useState("09:00");
  const [hourTo, setHourTo] = useState("13:00");
  const [holErr, setHolErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (url: string, body: unknown, success: [string, string?], after?: () => void) => {
    setBusy(true);
    try {
      await api(url, body);
      toast(success[0], success[1]);
      after?.();
      router.refresh();
    } catch (failure) {
      const message = failure instanceof ApiFailure ? failure.message : "משהו השתבש. נסה/י שוב.";
      if (dialog) setHolErr(message);
      else toast("השמירה נכשלה", message, "error");
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => {
    setDialog("add");
    setEditing(null);
    setName("");
    const today = isoDate(new Date());
    setFrom(today);
    setTo(today);
    setIsBlocked(true);
    setAllDay(true);
    setHourFrom("09:00");
    setHourTo("13:00");
    setHolErr("");
  };

  const openEdit = (entry: Entry) => {
    setDialog("edit");
    setEditing(entry);
    setName(entry.name);
    setFrom(entry.from);
    setTo(entry.to);
    setIsBlocked(entry.blocks);
    setAllDay(!entry.blockedFrom);
    setHourFrom(entry.blockedFrom ?? "09:00");
    setHourTo(entry.blockedTo ?? "23:59");
    setHolErr("");
  };

  const closeDialog = () => {
    setDialog(null);
    setEditing(null);
  };

  const saveHoliday = () => {
    if (dialog === "add") {
      void run(
        "/api/app/settings/holidays",
        { action: "add", name: name.trim(), from, to, allDay, hourFrom: allDay ? undefined : hourFrom, hourTo: allDay ? undefined : hourTo },
        ["יום החופש נוסף", name.trim()],
        closeDialog,
      );
    } else if (editing?.isRange) {
      void run(
        "/api/app/settings/holidays",
        { action: "edit_range", id: editing.id, name: name.trim(), from, to, blocks: isBlocked, allDay, hourFrom: allDay ? undefined : hourFrom, hourTo: allDay ? undefined : hourTo },
        ["השינויים נשמרו", name.trim()],
        closeDialog,
      );
    } else if (editing) {
      void run(
        "/api/app/settings/holidays",
        { action: "edit", date: editing.from, blocks: isBlocked, allDay, from: allDay ? undefined : hourFrom, to: allDay ? undefined : hourTo },
        ["השינויים נשמרו", editing.name],
        closeDialog,
      );
    }
  };

  const list = entries(holidays);
  const months: { key: number; title: string; rows: object[] }[] = [];
  for (const entry of list) {
    const month = Number(entry.from.slice(5, 7));
    let bucket = months[months.length - 1];
    if (!bucket || bucket.key !== month) {
      bucket = { key: month, title: `${MONTHS[month - 1]} ${year}`, rows: [] };
      months.push(bucket);
    }
    const source = SOURCE_GLYPH[entry.source];
    const range = entry.to !== entry.from;
    bucket.rows.push({
      id: entry.id,
      name: entry.name,
      dateLabel: range ? `${dotted(entry.from).slice(0, 5)}–${dotted(entry.to)}` : dotted(entry.from),
      dowLabel: range ? `${entry.days} ימים` : DOWS[localDate(entry.from).getDay()],
      badge: (
        <Badge tone={TYPES[entry.kind][0]} size="sm">
          {TYPES[entry.kind][1]}
        </Badge>
      ),
      src: (
        <span title={source[3]} style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "var(--type-caption)", fontWeight: 500, color: source[2], whiteSpace: "nowrap" }}>
          <Glyph paths={source[0]} size={13} />
          {source[1]}
        </span>
      ),
      stateEl: (
        <span style={{ font: "var(--type-label)", color: entry.blocks ? "var(--text-primary)" : "var(--text-tertiary)", whiteSpace: "nowrap" }}>
          {!entry.blocks ? "פתוח" : !entry.blockedFrom ? "חסום · כל היום" : (
            <>
              חסום · <span dir="ltr">{`${entry.blockedFrom}–${entry.blockedTo ?? "23:59"}`}</span>
            </>
          )}
        </span>
      ),
      edit: () => openEdit(entry),
    });
  }

  const locked = dialog === "edit" && !editing?.isRange;
  const goYear = (next: number) => router.push(`${path}?year=${next}`);

  const dateField = (value: string, onChange: (date: Date) => void) =>
    locked ? (
      <DateField value={localDate(value)} onChange={() => {}} disabled />
    ) : (
      <DateField value={value ? localDate(value) : null} onChange={onChange} />
    );

  const v = {
    ...common,
    profiles: [
      { row: regular, title: "פגישה רגילה", icon: "user", hasNote: false, soft: "var(--color-primary-soft-2)", fg: "var(--teal-800)" },
      { row: spouse, title: "פגישה זוגית", icon: "users", hasNote: true, soft: "var(--purple-100)", fg: "var(--purple-700)" },
    ].map(({ row, title, icon, hasNote, soft, fg }) => ({
      key: row.profile,
      title,
      icon,
      hasNote,
      cardStyle: { minWidth: 0, display: "grid", gridTemplateRows: "100%" },
      iconStyle: { width: 40, height: 40, flex: "none", borderRadius: "50%", background: soft, color: fg, display: "flex", alignItems: "center", justifyContent: "center" },
      fields: FIELDS.map((field) => ({
        key: field.key,
        label: field.label,
        hint: field.hint,
        unit: field.unit,
        value: forms[row.profile][field.key],
        onChange: (event: Change) => setForms((all) => ({ ...all, [row.profile]: { ...all[row.profile], [field.key]: event.target.value } })),
      })),
      save: () => {
        const values = Object.fromEntries(FIELDS.map((field) => [field.key, Number(forms[row.profile][field.key])]));
        void run("/api/app/settings/profile", { profile: row.profile, ...values }, ["השינויים נשמרו", "ההגדרות עודכנו."]);
      },
      reset: () => setForms((all) => ({ ...all, [row.profile]: initial(row) })),
    })),
    linkGlyph: <Glyph paths={LINK} size={20} />,
    linkDays: link,
    onLinkDays: (event: Change) => setLink(event.target.value),
    saveLink: () => run("/api/app/settings/link-validity", { days: Number(link) }, ["השינויים נשמרו", "ההגדרות עודכנו."]),
    resetLink: () => setLink(String(linkDays)),
    holPad: common.isPhone ? "md" : "lg",
    holYear: year,
    holPrevOff: year <= firstYear,
    holNextOff: year >= lastYear,
    holPrev: () => goYear(year - 1),
    holNext: () => goYear(year + 1),
    openHolAdd: openAdd,
    holMonths: months,
    holNone: list.length === 0,
    settingsHistory: history.map((row) => ({
      id: row.id,
      field: row.field,
      from: row.old_value ?? "—",
      to: row.new_value ?? "—",
      unit: "",
      when: `${fmtDate(row.changed_at)} ${fmtTime(row.changed_at)}`,
      actor: row.changed_by_name,
    })),
    holDlgOpen: !!dialog,
    closeHolAdd: closeDialog,
    holDlgTitle: dialog === "edit" ? (editing?.isRange ? "עריכת יום חופש" : "עריכת יום חג") : "הוספת יום חופש",
    holDlgDesc: dialog === "edit" ? (editing?.isRange ? "יום חופש לכל הסוכנות." : "נטען אוטומטית מלוח החגים. השם והתאריך לא ניתנים לשינוי.") : "יום חופש לכל הסוכנות. לא ייקבעו בו פגישות.",
    holName: name,
    onHolName: (event: Change) => setName(event.target.value),
    holLocked: locked,
    holFromField: dateField(from, (date) => {
      const value = isoDate(date);
      setFrom(value);
      if (!to || to < value) setTo(value);
      setHolErr("");
    }),
    holToField: dateField(to, (date) => {
      setTo(isoDate(date));
      setHolErr("");
    }),
    holDatesHint: !locked,
    holStateOn: dialog === "edit",
    onHolOn: () => setIsBlocked(!isBlocked),
    holOnPressed: isBlocked,
    holOnLabel: isBlocked ? "חסום" : "פתוח",
    holTrack: isBlocked ? "var(--color-primary)" : "var(--gray-300)",
    holKnob: isBlocked ? "22px" : "2px",
    holBlocked: dialog !== "edit" || isBlocked,
    holAllDay: allDay,
    toggleHolAllDay: () => setAllDay(!allDay),
    holPartial: (dialog !== "edit" || isBlocked) && !allDay,
    holHFrom: hourFrom,
    onHolHFrom: (event: Change) => setHourFrom(event.target.value),
    holHTo: hourTo,
    onHolHTo: (event: Change) => setHourTo(event.target.value),
    holErr,
    holAddFooter:
      dialog === "edit" ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "1 1 100%", flexWrap: "wrap" }}>
          <Button size="md" iconStart="check" loading={busy} disabled={!name.trim()} onClick={saveHoliday}>
            שמירה
          </Button>
          <Button variant="ghost" size="md" onClick={closeDialog}>
            ביטול
          </Button>
          {editing?.isRange && (
            <span style={{ marginInlineStart: "auto", display: "flex" }}>
              <QuietButton paths={TRASH} label="מחיקה" onClick={() => setDelOpen(true)} tone="danger" />
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12 }}>
          <Button size="md" iconStart="plus" loading={busy} disabled={!name.trim()} onClick={saveHoliday}>
            הוספה
          </Button>
          <Button variant="ghost" size="md" onClick={closeDialog}>
            ביטול
          </Button>
        </div>
      ),
    holDelOpen: delOpen,
    closeHolDel: () => setDelOpen(false),
    holDelDesc: editing ? `${editing.name} ● ${dotted(editing.from)}` : "",
    holDelFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          variant="destructive"
          size="md"
          iconStart="trash-2"
          loading={busy}
          onClick={() =>
            run("/api/app/settings/holidays", { action: "delete", id: editing!.id }, ["יום החופש נמחק", editing!.name], () => {
              setDelOpen(false);
              closeDialog();
            })
          }
        >
          מחיקה
        </Button>
        <Button variant="ghost" size="md" onClick={() => setDelOpen(false)}>
          ביטול
        </Button>
      </div>
    ),
  };

  return (
    <>
      <SettingsView v={v} />
      <HolDlgOpen4 v={v} />
      <HolDelOpen5 v={v} />
    </>
  );
}
