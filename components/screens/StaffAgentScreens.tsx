"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Badge, Button } from "@/components/ds";
import { AgentCalendarView } from "@/components/views/staff/AgentCalendarView";
import { AgentSettingsView } from "@/components/views/staff/AgentSettingsView";
import { AgentsView } from "@/components/views/staff/AgentsView";
import { EmailOpen6 } from "@/components/views/staff/dialogs/EmailOpen6";
import { ExcOpen7 } from "@/components/views/staff/dialogs/ExcOpen7";
import { useToast } from "@/components/shell/ToastProvider";
import type { CalendarBlock, CalendarDay } from "@/lib/booking/calendar-view";
import { api, ApiFailure } from "@/lib/client/api";
import { dotted, isoDate, localDate } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";
import { overrideRows, useHoursEditor, useOverrideEditor, type HolidayRow, type HourRow, type OverrideRow } from "./scheduleEditors";

export interface AgentRow {
  id: string;
  name: string;
  email: string;
  light: "green" | "amber" | "red";
  daily: string;
  monthly: string;
  weight: string;
  count: string;
  blockDate: string | null;
  blockReason: string | null;
  disconnected: boolean;
  excludedFor: string[];
}

const LIGHT_COLOR = { green: "var(--status-success)", amber: "var(--status-warning)", red: "var(--status-error)" };
const LIGHT_LABEL = { green: "ירוק", amber: "כתום", red: "אדום" };

function Light({ color }: { color: AgentRow["light"] }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: LIGHT_COLOR[color] }} />
      <span>{LIGHT_LABEL[color]}</span>
    </span>
  );
}

function BlockCell({ row }: { row: AgentRow }) {
  if (!row.blockDate) return <span style={{ display: "block", textAlign: "center", color: "var(--text-placeholder)" }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ display: "block", font: "var(--type-body-sm)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
        חסום מ-<span dir="ltr">{row.blockDate}</span>
      </span>
      <span style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{row.blockReason}</span>
    </div>
  );
}

const DisconnectedBadge = () => (
  <Badge tone="error" icon="alert-circle" size="sm">
    היומן לא מחובר
  </Badge>
);

export function AgentsScreen({ rows, specializations }: { rows: AgentRow[]; specializations: { value: string; label: string }[] }) {
  const router = useRouter();
  const common = useCommonVM();
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("");
  const [filters, setFilters] = useState(false);
  const term = search.trim().toLowerCase();
  const filtered = rows.filter((row) => (!term || row.name.toLowerCase().includes(term) || row.email.includes(term)) && (!spec || !row.excludedFor.includes(spec)));
  const go = (row: AgentRow) => router.push(`/admin/agents/${row.id}`);
  return (
    <AgentsView
      v={{
        ...common,
        agentFilterVariant: filters ? "primary" : "outline",
        toggleAgentFilters: () => setFilters(!filters),
        showAgentFilters: !common.isPhone || filters,
        agentSearch: search,
        onAgentSearch: (event: { target: { value: string } }) => setSearch(event.target.value),
        specOptions: [{ value: "", label: "הכל" }, ...specializations],
        spec,
        onSpec: setSpec,
        agentColumns: [
          {
            key: "name",
            title: "סוכן/ת",
            sortable: true,
            nowrap: true,
            width: "100%",
            render: (row: AgentRow) => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {row.name}
                {row.disconnected && <DisconnectedBadge />}
              </span>
            ),
          },
          { key: "email", title: "מייל", ltr: true, align: "center", nowrap: true, width: 1 },
          { key: "light", title: "רמזור", align: "center", nowrap: true, width: 1, render: (row: AgentRow) => <Light color={row.light} /> },
          { key: "block", title: "חסימה", align: "center", nowrap: true, width: 1, render: (row: AgentRow) => <BlockCell row={row} /> },
          { key: "daily", title: "מגבלה יומית", ltr: true, align: "center", nowrap: true, width: 1 },
          { key: "monthly", title: "מגבלה חודשית", ltr: true, align: "center", nowrap: true, width: 1 },
          { key: "weight", title: "משקל", ltr: true, align: "center", nowrap: true, width: 1 },
        ],
        agentRows: filtered,
        goAgentRow: go,
        agentCards: filtered.map((row) => ({
          ...row,
          go: () => go(row),
          lightEl: <Light color={row.light} />,
          hasBlock: !!row.blockDate,
          blockEl: <BlockCell row={row} />,
          disc: row.disconnected,
          discEl: <DisconnectedBadge />,
        })),
      }}
    />
  );
}

function useCalendarLink(agentId: string, email: string) {
  const toast = useToast();
  return async () => {
    try {
      await api(`/api/app/agents/${agentId}/calendar-link`, {});
      toast("הקישור נשלח", `קישור לחיבור היומן נשלח אל ${email}.`);
    } catch (failure) {
      toast("השליחה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    }
  };
}

export function AgentSettingsScreen({
  agent,
  hours,
  overrides,
  holidays,
  futureCount,
}: {
  agent: AgentRow;
  hours: HourRow[];
  overrides: OverrideRow[];
  holidays: HolidayRow[];
  futureCount: number;
}) {
  const router = useRouter();
  const common = useCommonVM();
  const toast = useToast();
  const hoursEditor = useHoursEditor(hours, agent.email, ["השינויים נשמרו", "ההגדרות עודכנו."]);
  const overrideEditor = useOverrideEditor(agent.email);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const sendCalLink = useCalendarLink(agent.id, agent.email);

  async function changeEmail() {
    setBusy(true);
    try {
      await api(`/api/app/agents/${agent.id}/email`, { email: newEmail.trim() });
      setEmailOpen(false);
      setNewEmail("");
      toast("המייל עודכן", `${agent.name} קיבל/ה קישור לחיבור היומן החדש. עד החיבור לא יוצע/תוצע לפגישות חדשות.`);
      router.refresh();
    } catch (failure) {
      toast("העדכון נכשל", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  }

  const v = {
    ...common,
    ...hoursEditor,
    ...overrideEditor.vm,
    goAgents: () => router.push("/admin/agents"),
    goCalendar: () => router.push(`/admin/agents/${agent.id}/calendar`),
    agDisc: agent.disconnected,
    sendCalLink,
    agName: agent.name,
    agEmailCur: agent.email,
    openEmail: () => setEmailOpen(true),
    commercial: [
      { label: "רמזור", value: LIGHT_LABEL[agent.light], dot: true, dotColor: LIGHT_COLOR[agent.light] },
      { label: "מכסה יומית", value: agent.daily },
      { label: "מכסה חודשית", value: agent.monthly },
      { label: "משקל", value: agent.weight },
      { label: "נקבעו החודש", value: agent.count },
    ],
    overrides: overrideRows(overrides, holidays, overrideEditor.remove),
    openExc: overrideEditor.open,
    excKindOptions: [
      { value: "block", label: "חסימה", description: "הסוכן/ת לא יוצע/תוצע במועדים האלה" },
      { value: "open", label: "פתיחה", description: "פתיחת מועדים מחוץ לשעות הפעילות הרגילות" },
    ],
    emailOpen,
    closeEmail: () => setEmailOpen(false),
    newEmail,
    onNewEmail: (event: { target: { value: string } }) => setNewEmail(event.target.value),
    futureCount,
    emailFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button size="md" iconStart="check" loading={busy} disabled={!newEmail.trim()} onClick={changeEmail}>
          עדכון מייל
        </Button>
        <Button variant="ghost" size="md" onClick={() => setEmailOpen(false)}>
          ביטול
        </Button>
      </div>
    ),
  };
  return (
    <>
      <AgentSettingsView v={v} />
      <ExcOpen7 v={v} />
      <EmailOpen6 v={v} />
    </>
  );
}

const ROW = 44;
const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const TONES: Record<string, { fill: string; border: string; text: string }> = {
  meeting: { fill: "var(--teal-100)", border: "var(--teal-400)", text: "var(--teal-800)" },
  pair: { fill: "var(--purple-100)", border: "var(--purple-300)", text: "var(--purple-700)" },
  busy: { fill: "var(--gray-200)", border: "var(--gray-400)", text: "var(--gray-700)" },
  blocked: { fill: "var(--red-100)", border: "color-mix(in srgb, var(--red-500) 45%, var(--red-100))", text: "var(--red-600)" },
  holiday: { fill: "var(--amber-100)", border: "color-mix(in srgb, var(--amber-500) 45%, var(--amber-100))", text: "var(--amber-600)" },
  quota: { fill: "var(--blue-100)", border: "color-mix(in srgb, var(--blue-500) 45%, var(--blue-100))", text: "var(--blue-600)" },
};

const PART_STYLE: CSSProperties = {
  flex: "1 1 0",
  minHeight: 0,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  padding: "0 6px",
  background: "var(--teal-100)",
  border: "1px solid var(--teal-400)",
  borderRadius: 6,
  color: "var(--teal-800)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
};

function blockVM(block: CalendarBlock) {
  const hours = (block.end - block.start) / 60;
  const top = (block.start / 60) * ROW;
  if (block.kind === "buffer") {
    return {
      isSingle: false,
      isPair: false,
      title: block.title,
      style: { position: "absolute", top, height: hours * ROW, insetInlineStart: 0, insetInlineEnd: 0, backgroundImage: "repeating-linear-gradient(135deg, var(--gray-300) 0, var(--gray-300) 1px, transparent 1px, transparent 7px)" } as CSSProperties,
    };
  }
  if (block.kind === "off" || block.kind === "notice") {
    return {
      isSingle: false,
      isPair: false,
      title: block.title,
      style: { position: "absolute", top, height: hours * ROW, insetInlineStart: 0, insetInlineEnd: 0, background: "rgba(24,24,24,.035)" } as CSSProperties,
    };
  }
  const tone = TONES[block.kind];
  if (block.kind === "pair") {
    return {
      isPair: true,
      isSingle: false,
      title: block.title,
      style: { position: "absolute", top: top + 2, height: hours * ROW - 4, insetInlineStart: 4, insetInlineEnd: 4, background: tone.fill, borderRadius: 8, border: `1px solid ${tone.border}`, padding: "3px 4px", display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" } as CSSProperties,
      parts: block.parts?.map((part) => ({ ...part, style: PART_STYLE })),
    };
  }
  return {
    isSingle: true,
    isPair: false,
    label: block.label,
    time: block.time,
    title: block.title,
    style: {
      position: "absolute",
      top: top + 2,
      height: hours * ROW - 4,
      insetInlineStart: 4,
      insetInlineEnd: 4,
      background: tone.fill,
      color: tone.text,
      borderRadius: 8,
      border: `1px solid ${tone.border}`,
      padding: hours <= 0.5 ? "0 7px" : "4px 7px",
      overflow: "hidden",
      whiteSpace: "nowrap",
      display: "flex",
      flexDirection: "row",
      alignItems: hours <= 0.5 ? "center" : "flex-start",
      justifyContent: "space-between",
      gap: 6,
      fontFamily: "var(--font-body)",
      fontSize: 11.5,
      fontWeight: 500,
      lineHeight: 1.3,
    } as CSSProperties,
  };
}

const shift = (date: string, days: number) => {
  const next = localDate(date);
  next.setDate(next.getDate() + days);
  return isoDate(next);
};

const sundayOf = (date: Date) => {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  return isoDate(next);
};

export function AgentCalendarScreen({ agent }: { agent: AgentRow }) {
  const router = useRouter();
  const common = useCommonVM();
  const [view, setView] = useState("");
  const activeView = view || (common.isPhone ? "3days" : "week");
  const size = activeView === "day" ? 1 : activeView === "3days" ? 3 : 7;
  const [start, setStart] = useState<string | null>(null);
  const today = isoDate(new Date());
  const from = start ?? (size === 7 ? sundayOf(new Date()) : today);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [error, setError] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const sendCalLink = useCalendarLink(agent.id, agent.email);

  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const id = ++latestLoad.current;
    setError(false);
    try {
      const result = await api<{ days: CalendarDay[] }>(`/api/app/agents/${agent.id}/calendar?from=${from}&days=${size}`);
      if (id === latestLoad.current) setDays(result.days);
    } catch {
      if (id === latestLoad.current) setError(true);
    }
  }, [agent.id, from, size]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = ROW * 8;
  }, [days.length]);

  const timeCol = common.isPhone ? 38 : 56;
  const gridMin = common.isPhone ? 0 : size === 7 ? 700 : size === 3 ? 340 : 250;
  const gridStyle = { minWidth: gridMin, display: "grid", gridTemplateColumns: `${timeCol}px repeat(${days.length || size}, minmax(0, 1fr))`, gap: 0 };
  const bodyStyle = { ...gridStyle, paddingTop: 10, paddingBottom: 10 };

  const visibleDays = days.map((day, index) => ({
    key: day.date,
    name: DAY_NAMES[day.weekday],
    date: dotted(day.date).slice(0, 5),
    allDayLabel: day.allDay?.label,
    nameStyle: { font: "var(--type-label)", color: day.isToday ? "var(--text-brand)" : "var(--text-primary)" },
    dateStyle: { font: "var(--type-caption)", color: day.isToday ? "var(--teal-700)" : "var(--text-tertiary)", fontWeight: day.isToday ? 500 : 400 },
    colStyle: {
      position: "relative",
      height: 24 * ROW,
      overflow: "clip",
      borderInlineStart: "1px solid var(--border-subtle)",
      borderInlineEnd: index === days.length - 1 ? "1px solid var(--border-subtle)" : "none",
      backgroundColor: day.allDay?.kind === "holiday" ? "var(--amber-50)" : day.allDay?.kind === "blocked" ? "var(--red-50)" : day.allDay?.kind === "quota" ? "var(--blue-50)" : day.isToday ? "var(--teal-50)" : "#fff",
      backgroundImage: `repeating-linear-gradient(to bottom, var(--border-subtle) 0, var(--border-subtle) 1px, transparent 1px, transparent ${ROW}px)`,
    },
    allDayStyle: day.allDay
      ? {
          position: "sticky",
          top: 4,
          zIndex: 5,
          margin: 4,
          background: TONES[day.allDay.kind].fill,
          color: TONES[day.allDay.kind].text,
          border: `1px solid ${TONES[day.allDay.kind].border}`,
          borderRadius: 8,
          padding: "5px 7px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          fontWeight: 500,
          lineHeight: 1.2,
          overflow: "hidden",
        }
      : null,
    blocks: day.blocks.map(blockVM),
  }));

  const first = days[0]?.date ?? from;
  const lastDate = days[days.length - 1]?.date ?? from;
  const v = {
    ...common,
    goAgent: () => router.push(`/admin/agents/${agent.id}`),
    agName: agent.name,
    agDisc: agent.disconnected,
    sendCalLink,
    calBarStyle: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: common.isPhone ? "center" : "space-between" },
    rangeLabel: size === 1 ? dotted(first) : `${dotted(first).slice(0, 5)} – ${dotted(lastDate)}`,
    goToday: () => setStart(size === 7 ? sundayOf(new Date()) : today),
    calPrev: () => setStart(shift(from, -size)),
    calNext: () => setStart(shift(from, size)),
    viewTabs: common.isPhone
      ? [
          { value: "3days", label: "3 ימים" },
          { value: "day", label: "יום" },
        ]
      : [
          { value: "week", label: "שבוע" },
          { value: "day", label: "יום" },
        ],
    calView: activeView,
    onCalView: (value: string) => {
      setView(value);
      setStart(null);
    },
    legend: [
      { label: "פגישה במערכת", bg: TONES.meeting.fill, border: TONES.meeting.border },
      { label: "פגישה זוגית", bg: TONES.pair.fill, border: TONES.pair.border },
      { label: "עסוק", bg: TONES.busy.fill, border: TONES.busy.border },
      { label: "חסום", bg: TONES.blocked.fill, border: TONES.blocked.border },
      { label: "חג", bg: TONES.holiday.fill, border: TONES.holiday.border },
      { label: "מכסה יומית מלאה", bg: TONES.quota.fill, border: TONES.quota.border },
      { label: "מחוץ לשעות הפעילות", bg: "rgba(24,24,24,.035)", border: "var(--border-default)" },
    ],
    calHeadStyle: gridStyle,
    calGridStyle: bodyStyle,
    hourStyle: { height: ROW, flex: "none", position: "relative", font: "var(--type-caption)", fontSize: common.isPhone ? 10 : 12, lineHeight: "16px", color: "var(--text-tertiary)" },
    hourLabelStyle: { position: "absolute", top: 0, insetInlineStart: 0, insetInlineEnd: 0, textAlign: "center", transform: "translateY(-50%)", whiteSpace: "nowrap" },
    hourLabels: Array.from({ length: 24 }, (_, hour) => ({ key: hour, label: `${String(hour).padStart(2, "0")}:00` })),
    visibleDays,
    calScroll: scroll,
  };
  return (
    <>
      {error && (
        <Button variant="outline" size="md" onClick={load}>
          נסה/י שוב
        </Button>
      )}
      <AgentCalendarView v={v} />
    </>
  );
}
