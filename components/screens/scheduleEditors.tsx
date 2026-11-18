"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ds";
import { controlStyle, formatDate, TIME_LIST, timeOptionStyle } from "@/components/views/pickers";
import { useToast } from "@/components/shell/ToastProvider";
import { api, ApiFailure } from "@/lib/client/api";
import { dotted, isoDate } from "@/lib/client/format";

export interface HourRow {
  weekday: number;
  enabled: boolean;
  start: string;
  end: string;
}

export interface OverrideRow {
  id: string;
  date: string;
  kind: "block" | "open";
  start: string | null;
  end: string | null;
  note: string | null;
}

export interface HolidayRow {
  date: string;
  name: string;
  from: string | null;
  to: string | null;
}

const NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function normalizeHours(rows: HourRow[]): HourRow[] {
  return NAMES.map((_, weekday) => rows.find((row) => row.weekday === weekday) ?? { weekday, enabled: false, start: "09:00", end: "17:00" });
}

export function useHoursEditor(initial: HourRow[], agentEmail: string | undefined, savedText: [string, string]) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(() => normalizeHours(initial));
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (weekday: number, change: Partial<HourRow>) => setRows((list) => list.map((row) => (row.weekday === weekday ? { ...row, ...change } : row)));
  const openWeekday = open ? Number(open.split("-")[0]) : null;
  const openField = open?.split("-")[1];
  const selected = openWeekday !== null ? rows[openWeekday][openField === "s" ? "start" : "end"] : null;

  return {
    days: rows.map((row) => {
      const on = row.enabled;
      const startKey = `${row.weekday}-s`;
      const endKey = `${row.weekday}-e`;
      return {
        key: row.weekday,
        name: NAMES[row.weekday],
        start: row.start,
        end: row.end,
        off: !on,
        trackBg: on ? "var(--color-primary)" : "var(--gray-300)",
        knob: on ? "22px" : "2px",
        opacity: on ? 1 : 0.5,
        toggle: () => {
          update(row.weekday, { enabled: !on });
          setOpen(null);
        },
        openStart: on ? () => setOpen(open === startKey ? null : startKey) : () => {},
        openEnd: on ? () => setOpen(open === endKey ? null : endKey) : () => {},
        startOpen: open === startKey,
        endOpen: open === endKey,
        startStyle: controlStyle(open === startKey, !on),
        endStyle: controlStyle(open === endKey, !on),
      };
    }),
    timeOptions: TIME_LIST.map((label) => ({
      label,
      style: timeOptionStyle(selected === label),
      pick: () => {
        if (openWeekday === null) return;
        update(openWeekday, openField === "s" ? { start: label } : { end: label });
        setOpen(null);
      },
    })),
    saving,
    hoursReset: () => {
      setRows(normalizeHours(initial));
      setOpen(null);
    },
    agSaveHours: async () => {
      setSaving(true);
      try {
        await api("/api/app/schedule/hours", { agentEmail, days: rows });
        toast(savedText[0], savedText[1]);
        router.refresh();
      } catch (failure) {
        toast("השמירה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
      } finally {
        setSaving(false);
      }
    },
  };
}

export function overrideRows(overrides: OverrideRow[], holidays: HolidayRow[], remove: (id: string) => void) {
  const list = [
    ...holidays.map((row) => ({
      sort: row.date,
      date: dotted(row.date),
      time: row.from ? `${row.from} - ${row.to ?? "23:59"}` : "",
      note: row.from ? ` ● ${row.name}` : `כל היום ● ${row.name}`,
      label: "חג",
      tone: "warning",
      icon: "calendar",
      remove: undefined as undefined | (() => void),
    })),
    ...overrides.map((row) => ({
      sort: row.date,
      date: dotted(row.date),
      time: row.start ? `${row.start} - ${row.end}` : "",
      note: row.start ? (row.note ? ` ● ${row.note}` : "") : `כל היום${row.note ? ` ● ${row.note}` : ""}`,
      label: row.kind === "block" ? "חסימה" : "פתיחה",
      tone: row.kind === "block" ? "error" : "success",
      icon: row.kind === "block" ? "x" : "plus",
      remove: () => remove(row.id),
    })),
  ];
  return list.sort((a, b) => a.sort.localeCompare(b.sort));
}

export function useOverrideEditor(agentEmail: string | undefined) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("block");
  const [allDay, setAllDay] = useState(true);
  const [date, setDate] = useState<Date>(() => new Date());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");
  const [note, setNote] = useState("");
  const [timeOpen, setTimeOpen] = useState<"s" | "e" | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setTimeOpen(null);
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/app/schedule/overrides/${id}`, undefined, "DELETE");
      toast("ההחרגה נמחקה");
      router.refresh();
    } catch (failure) {
      toast("המחיקה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    }
  };

  const submit = async () => {
    const whole = kind === "block" && allDay;
    setBusy(true);
    try {
      await api("/api/app/schedule/overrides", {
        agentEmail,
        date: isoDate(date),
        kind,
        start: whole ? undefined : start,
        end: whole ? undefined : end,
        note: note.trim() || undefined,
      });
      close();
      setNote("");
      toast("ההחרגה נוספה", `${formatDate(date)} ● ${whole ? "כל היום" : `${start} - ${end}`}`);
      router.refresh();
    } catch (failure) {
      toast("ההוספה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  };

  const hoursOn = kind === "open" || !allDay;
  return {
    remove,
    open: () => setOpen(true),
    vm: {
      agExcOpen: open,
      excOpen: open,
      closeAgExc: close,
      closeExc: close,
      excKind: kind,
      onExcKind: (value: string) => setKind(value),
      excDate: date,
      pickExcDate: setDate,
      noDisabled: [],
      todayDate: new Date(),
      excCalProps: { style: { width: "100%", maxWidth: 320 } },
      excAllDay: allDay,
      toggleExcAllDay: () => setAllDay(!allDay),
      showAllDay: kind === "block",
      excHours: hoursOn,
      excStart: start,
      excEnd: end,
      excStartOpen: timeOpen === "s",
      excEndOpen: timeOpen === "e",
      excStartStyle: controlStyle(timeOpen === "s"),
      excEndStyle: controlStyle(timeOpen === "e"),
      openExcStart: () => setTimeOpen(timeOpen === "s" ? null : "s"),
      openExcEnd: () => setTimeOpen(timeOpen === "e" ? null : "e"),
      excTimeOptions: TIME_LIST.map((label) => ({
        label,
        style: timeOptionStyle((timeOpen === "s" ? start : end) === label),
        pick: () => {
          if (timeOpen === "s") setStart(label);
          else setEnd(label);
          setTimeOpen(null);
        },
      })),
      excNote: note,
      onExcNote: (event: { target: { value: string } }) => setNote(event.target.value),
      excFooter: (
        <div style={{ display: "flex", gap: 12 }}>
          <Button size="md" iconStart="plus" loading={busy} onClick={submit}>
            הוספת החרגה
          </Button>
          <Button variant="ghost" size="md" onClick={close}>
            ביטול
          </Button>
        </div>
      ),
    },
  };
}
