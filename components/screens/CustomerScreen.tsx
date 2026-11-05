"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Icon } from "@/components/ds";
import { CustomerView } from "@/components/views/customer/CustomerView";
import { GLYPH, Glyph } from "@/components/views/bits";
import { formatDate } from "@/components/views/pickers";
import { api, ApiFailure } from "@/lib/client/api";
import { addMinutes, fmtDate, fmtDow, fmtRange, isoDate, localDate } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";
import { factRow } from "./NewBookingScreen";

const DAY_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const DOWS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "יום שבת"];

type State = "loading" | "picker" | "empty" | "done" | "booked" | "dead" | "error";

function CustCalendar({ value, onChange, slots, isPhone }: { value: Date | null; onChange: (date: Date) => void; slots: Record<string, string[]>; isPhone: boolean }) {
  const dates = Object.keys(slots).sort();
  const first = dates[0] ? localDate(dates[0]) : new Date();
  const last = dates[dates.length - 1] ? localDate(dates[dates.length - 1]) : new Date();
  const [view, setView] = useState(() => new Date((value ?? first).getFullYear(), (value ?? first).getMonth(), 1));
  const minMonth = new Date(first.getFullYear(), first.getMonth(), 1);
  const maxMonth = new Date(last.getFullYear(), last.getMonth(), 1);
  const canPrev = view > minMonth;
  const canNext = view < maxMonth;
  const start = new Date(view.getFullYear(), view.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
  const today = isoDate(new Date());
  const selected = value ? isoDate(value) : "";

  const nav = (icon: string, label: string, on: boolean, go: () => void) => (
    <button
      type="button"
      aria-label={label}
      disabled={!on}
      onClick={go}
      className={on ? "hti-day" : undefined}
      style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: on ? "var(--gray-600)" : "var(--gray-300)", display: "flex", alignItems: "center", justifyContent: "center", cursor: on ? "pointer" : "default" }}
    >
      <Icon name={icon} size={16} />
    </button>
  );

  return (
    <div style={{ width: "100%", maxWidth: isPhone ? "none" : 320, padding: 12, background: "#fff", borderRadius: "var(--radius-control)", border: "1px solid var(--border-default)", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {nav("chevron-right", "חודש קודם", canPrev, () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1)))}
        <span style={{ font: "var(--type-h3)", color: "var(--text-brand)", whiteSpace: "nowrap" }}>
          {MONTHS[view.getMonth()]} <span dir="ltr">{view.getFullYear()}</span>
        </span>
        {nav("chevron-left", "חודש הבא", canNext, () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1)))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_LETTERS.map((letter) => (
          <div key={letter} style={{ textAlign: "center", font: "var(--type-caption)", color: "var(--text-tertiary)", padding: "4px 0" }}>
            {letter}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, index) => {
          if (day.getMonth() !== view.getMonth()) return <div key={index} />;
          const key = isoDate(day);
          const has = !!slots[key]?.length;
          const isSelected = key === selected;
          return (
            <button
              key={index}
              type="button"
              disabled={!has}
              className={has && !isSelected ? "hti-day" : undefined}
              aria-label={`${day.getDate()} ${MONTHS[day.getMonth()]}${has ? "" : ", אין זמנים פנויים"}`}
              onClick={() => onChange(day)}
              style={{
                width: "100%",
                aspectRatio: "1",
                maxHeight: isPhone ? 44 : undefined,
                borderRadius: "var(--radius-sm)",
                border: key === today && !isSelected ? "1px solid var(--green-300)" : "1px solid transparent",
                background: isSelected ? "var(--color-primary)" : "transparent",
                color: isSelected ? "#fff" : !has ? "var(--gray-300)" : "var(--text-primary)",
                font: "var(--type-body-sm)",
                fontWeight: isSelected || has ? 500 : 400,
                cursor: has ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {day.getDate()}
              {has && !isSelected && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-primary)" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CustomerScreen({ token }: { token: string }) {
  const common = useCommonVM();
  const { isPhone } = common;
  const [state, setState] = useState<State>("loading");
  const [online, setOnline] = useState(true);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [facts, setFacts] = useState<[string, string, string][]>([]);

  const loadSlots = useCallback(async () => {
    const result = await api<{ slots: Record<string, string[]> }>("/api/app/public/links/slots", { token });
    setSlots(result.slots);
    const dates = Object.keys(result.slots).sort();
    setDate(dates[0] ? localDate(dates[0]) : null);
    setTime("");
    return dates.length;
  }, [token]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const view = await api<{ state: string; online?: boolean; agentName?: string | null; durationMin?: number; start?: string; end?: string }>("/api/app/public/links/view", { token });
      if (view.state === "booked") {
        setAgentName(view.agentName ?? null);
        setFacts([
          ["סוכן/ת", view.agentName ?? "", "rtl"],
          ["תאריך", `${fmtDow(view.start!)} ● ${fmtDate(view.start!)}`, "rtl"],
          ["שעה", fmtRange(view.start!, view.end!), "ltr"],
        ]);
        setState("booked");
        return;
      }
      if (view.state !== "open") {
        setState("dead");
        return;
      }
      setOnline(!!view.online);
      setAgentName(view.agentName ?? null);
      setDuration(view.durationMin ?? 30);
      const count = await loadSlots();
      setState(count ? "picker" : "empty");
    } catch (failure) {
      setState(failure instanceof ApiFailure && failure.code === "dead_link" ? "dead" : "error");
    }
  }, [token, loadSlots]);

  useEffect(() => {
     
    void load();
  }, [load]);

  async function confirm() {
    if (!date || !time) return;
    setBusy(true);
    setTaken(false);
    try {
      const result = await api<{ agentName: string; start: string; end: string; online: boolean }>("/api/app/public/links/book", { token, date: isoDate(date), time });
      setFacts([
        ["סוכן/ת", result.agentName, "rtl"],
        ["תאריך", `${fmtDow(result.start)} ● ${fmtDate(result.start)}`, "rtl"],
        ["שעה", fmtRange(result.start, result.end), "ltr"],
        ["סוג פגישה", result.online ? "פגישה אונליין" : "פגישה פרונטלית", "rtl"],
      ]);
      setState("done");
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "slot_taken") {
        setTaken(true);
        const count = await loadSlots();
        if (!count) setState("empty");
      } else if (failure instanceof ApiFailure && failure.code === "dead_link") {
        setState("dead");
      } else {
        setState("error");
      }
    } finally {
      setBusy(false);
    }
  }

  const picker = state === "picker";
  const done = state === "done" || state === "booked";
  const times = date ? (slots[isoDate(date)] ?? []) : [];
  const dayShort = date ? formatDate(date).slice(0, 5) : "";

  return (
    <CustomerView
      v={{
        ...common,
        custFrameMax: "100%",
        custCardMax: isPhone ? "none" : "880px",
        custLogoH: isPhone ? "48px" : "60px",
        custPad: isPhone ? "md" : "lg",
        custLoading: state === "loading",
        custShowAgent: picker || state === "empty",
        custHeadIcon: agentName ? "user" : "users",
        custHeadEyebrow: agentName ? "פגישה עם הסוכן/ת" : "פגישה עם סוכן/ת של",
        custHeadTitle: agentName ?? "הייטק סוכנות לביטוח",
        custKindBadge: online ? (
          <Badge tone="brand">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Glyph paths={GLYPH.VIDEO} size={14} />
              פגישה אונליין
            </span>
          </Badge>
        ) : (
          <Badge tone="purple" icon="map-pin">
            פגישה פרונטלית
          </Badge>
        ),
        durationLabel: `${duration} דקות`,
        custPicker: picker,
        custTaken: taken,
        custCalWrap: { flex: isPhone ? "1 1 100%" : "none", minWidth: 0, width: isPhone ? "100%" : 320 },
        custCalendar: picker ? (
          <CustCalendar
            value={date}
            slots={slots}
            isPhone={isPhone}
            onChange={(day) => {
              setDate(day);
              setTime("");
            }}
          />
        ) : null,
        custDayLabel: date ? `${DOWS[date.getDay()]} ● ${formatDate(date)}` : "",
        custSlotCount: `${times.length} זמנים פנויים`,
        custSlots: times,
        custSlot: time,
        pickCustSlot: setTime,
        custCols: isPhone ? 3 : 4,
        custNoSlot: !time,
        custBusy: busy,
        custCta: time ? `קביעת פגישה ל-${dayShort} בשעה ${time}` : "בחר/י שעה",
        custEndHint: time ? addMinutes(time, duration) : "",
        custConfirm: confirm,
        custEmpty: state === "empty",
        custDone: done,
        custDoneBg: state === "booked" ? "var(--color-primary-soft)" : "var(--green-100)",
        custDoneFg: state === "booked" ? "var(--color-primary)" : "var(--green-800)",
        custDoneIcon: state === "booked" ? "calendar" : "check",
        custDoneTitle: state === "booked" ? "כבר נקבעה פגישה" : "הפגישה נקבעה",
        custDoneNote: state === "booked" ? "לשינוי או ביטול יש לפנות לסוכן או למוקד." : "ההזמנה נשלחה אליך במייל.",
        custNoteIcon: state === "booked" ? "info" : "mail",
        custFacts: facts.map(([label, value, dir], index) => ({ label, value, dir, rowStyle: factRow(index === facts.length - 1) })),
        custDead: state === "dead",
        custError: state === "error",
        custRetry: load,
        custPhoneBar: isPhone && picker,
      }}
    />
  );
}
