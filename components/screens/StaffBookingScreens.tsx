"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { Badge, Button } from "@/components/ds";
import { GLYPH, Glyph } from "@/components/views/bits";
import { DateField, formatDate } from "@/components/views/pickers";
import { CancelOpen0 } from "@/components/views/staff/dialogs/CancelOpen0";
import { CustEmailOpen3 } from "@/components/views/staff/dialogs/CustEmailOpen3";
import { AlertsView } from "@/components/views/staff/AlertsView";
import { BookingDetailView } from "@/components/views/staff/BookingDetailView";
import { BookingsView } from "@/components/views/staff/BookingsView";
import { NewBookingView } from "@/components/views/staff/NewBookingView";
import { TeamsLink, teamsState } from "@/components/views/TeamsLink";
import { useToast } from "@/components/shell/ToastProvider";
import type { BookingEvent, BookingRow } from "@/lib/booking/types";
import { api, ApiFailure } from "@/lib/client/api";
import { CANCEL_BY_OPTIONS, whenText } from "@/lib/client/bookingView";
import { fmtDate, fmtDow, fmtRange, fmtTime, isoDate, localDate } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";
import { useSlotPicker } from "@/lib/client/useSlotPicker";
import { factRow } from "./NewBookingScreen";

type Change = { target: { value: string } };

const PIN = '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>';
const SURENSE_LEAD = "https://app.surense.com/leads/";

function statusOf(row: BookingRow): "planned" | "cancelled" | "done" {
  if (row.status === "cancelled") return "cancelled";
  return new Date(row.end_at).getTime() < Date.now() ? "done" : "planned";
}

const STATUS: Record<string, [string, string, string]> = {
  planned: ["success", "check-circle", "מתוכננת"],
  cancelled: ["error", "x", "בוטלה"],
  done: ["neutral", "check", "התקיימה"],
};

function LeadLink({ lead }: { lead: string }) {
  return (
    <a href={SURENSE_LEAD + lead} target="_blank" rel="noopener" dir="ltr" onClick={(event) => event.stopPropagation()} style={{ fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
      {lead}
    </a>
  );
}

export interface BookingsData {
  rows: BookingRow[];
  counts: { upcoming: number; past: number; cancelled: number };
  agentOptions: { value: string; label: string }[];
  range: string;
}

export function BookingsScreen({ rows, counts, agentOptions, range }: BookingsData) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const common = useCommonVM();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "start", dir: range === "upcoming" ? "asc" : "desc" });

  const setParam = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`${path}?${next}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== search) setParam({ q: search || null });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const sorted = [...rows].sort((a, b) => {
    const value = (row: BookingRow) => (sort.key === "customer" ? row.customer_name : sort.key === "agent" ? row.agent_name : row.start_at);
    const order = value(a).localeCompare(value(b), "he");
    return sort.dir === "asc" ? order : -order;
  });

  const bookingRows = sorted.map((row) => ({
    id: row.id,
    start: row.start_at,
    time: fmtRange(row.start_at, row.end_at),
    dow: fmtDow(row.start_at),
    date: fmtDate(row.start_at),
    customer: row.customer_name,
    lead: row.lead_number,
    agent: row.agent_name,
    remote: !row.in_person_address,
    where: row.in_person_address ?? "מרחוק",
    status: statusOf(row),
    bookedBy: row.booked_by_name ?? (row.source === "link" ? "לקוח/ה בקישור" : "—"),
    raw: row,
  }));

  const placeIcon = (remote: boolean): CSSProperties => ({
    width: 26,
    height: 26,
    flexShrink: 0,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: remote ? "var(--teal-50)" : "var(--purple-50)",
    color: remote ? "var(--teal-700)" : "var(--purple-500)",
  });

  type Row = (typeof bookingRows)[number];
  const bookingColumns = [
    { key: "start", title: "מועד", sortable: true, nowrap: true, width: 200, render: (row: Row) => <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{`${row.date} ${row.time}`}</span> },
    { key: "customer", title: "לקוח/ה", sortable: true, nowrap: true, width: 100 },
    { key: "lead", title: "ליד", width: 66, render: (row: Row) => <LeadLink lead={row.lead} /> },
    { key: "agent", title: "סוכן/ת", sortable: true, nowrap: true, width: 100 },
    {
      key: "where",
      title: "מקום",
      width: 215,
      render: (row: Row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={placeIcon(row.remote)}>
            <Glyph paths={row.remote ? GLYPH.VIDEO : PIN} size={15} />
          </span>
          <span style={{ font: "var(--type-body-sm)" }}>{row.where}</span>
        </div>
      ),
    },
    {
      key: "teams",
      title: "Teams",
      nowrap: true,
      width: 90,
      render: (row: Row) => (row.remote ? <TeamsLink url={row.raw.teams_join_url} state={teamsState(row.raw)} variant="compact" /> : <span style={{ display: "block", color: "var(--text-placeholder)" }}>—</span>),
    },
    {
      key: "status",
      title: "סטטוס",
      nowrap: true,
      width: 100,
      render: (row: Row) => (
        <Badge tone={STATUS[row.status][0]} icon={STATUS[row.status][1]} size="sm">
          {STATUS[row.status][2]}
        </Badge>
      ),
    },
    { key: "bookedBy", title: 'נקבעה ע"י', nowrap: true, width: 100 },
  ];

  const go = (id: string) => router.push(`/admin/bookings/${id}`);
  const from = params.get("from");
  const to = params.get("to");

  return (
    <BookingsView
      v={{
        ...common,
        rangeTabs: [
          { value: "upcoming", label: "עתידיות", count: counts.upcoming },
          { value: "past", label: "עברו" },
          { value: "cancelled", label: "מבוטלות", count: counts.cancelled },
        ],
        range,
        onRange: (value: string) => setParam({ range: value }),
        filterBtnVariant: filtersOpen ? "primary" : "outline",
        toggleFilters: () => setFiltersOpen(!filtersOpen),
        showFilters: !common.isPhone || filtersOpen,
        search,
        onSearch: (event: Change) => setSearch(event.target.value),
        agentFilterOptions: [{ value: "", label: "כל הסוכנים" }, ...agentOptions],
        agentFilter: params.get("agent") ?? "",
        onAgentFilter: (value: string) => setParam({ agent: value || null }),
        fromField: <DateField value={from ? localDate(from) : null} onChange={(date) => setParam({ from: isoDate(date) })} placeholder="בחירת תאריך" />,
        toField: <DateField value={to ? localDate(to) : null} onChange={(date) => setParam({ to: isoDate(date) })} placeholder="בחירת תאריך" />,
        bookingColumns,
        bookingRows,
        goDetail: (row: Row) => go(row.id),
        sortKey: sort.key,
        sortDir: sort.dir,
        onSort: (key: string, dir: "asc" | "desc") => setSort({ key, dir }),
        stop: (event: { stopPropagation: () => void }) => event.stopPropagation(),
        videoIcon: <Glyph paths={GLYPH.VIDEO} size={15} />,
        pinIcon: <Glyph paths={PIN} size={15} />,
        bookingCards: bookingRows.map((row) => ({
          ...row,
          go: () => go(row.id),
          statusTone: STATUS[row.status][0],
          statusIcon: STATUS[row.status][1],
          statusLabel: STATUS[row.status][2],
          onsite: !row.remote,
          teams: row.remote ? <TeamsLink url={row.raw.teams_join_url} state={teamsState(row.raw)} variant="compact" /> : null,
          leadUrl: SURENSE_LEAD + row.lead,
        })),
      }}
    />
  );
}

const EVENT_VIEW: Record<string, { action: string; icon: string; bg: string; fg: string }> = {
  created: { action: "הפגישה נקבעה", icon: "plus", bg: "var(--teal-50)", fg: "var(--color-primary)" },
  rescheduled: { action: "שינוי מועד", icon: "calendar", bg: "var(--amber-50)", fg: "var(--status-warning)" },
  cancelled: { action: "הפגישה בוטלה", icon: "x", bg: "var(--red-50)", fg: "var(--status-error)" },
  transferred: { action: "העברה לסוכן/ת", icon: "users", bg: "var(--purple-50)", fg: "var(--purple-500)" },
  email_changed: { action: "שינוי מייל הלקוח/ה", icon: "mail", bg: "var(--teal-50)", fg: "var(--color-primary)" },
  forced: { action: "קביעה כפויה", icon: "alert-triangle", bg: "var(--amber-50)", fg: "var(--status-warning)" },
  handoff_failed: { action: "הקביעה נכשלה", icon: "alert-circle", bg: "var(--red-50)", fg: "var(--status-error)" },
};

const CANCEL_LABEL: Record<string, string> = { customer: "לבקשת הלקוח/ה", agent: "לבקשת הסוכן/ת", coordinator: "לבקשת המתאמת" };

function eventDetail(event: BookingEvent): string {
  const before = (event.before ?? {}) as Record<string, string>;
  const after = (event.after ?? {}) as Record<string, string>;
  const when = (iso?: string) => (iso ? `${fmtDate(iso)} ${fmtTime(iso)}` : "");
  switch (event.action) {
    case "created":
      if (after.source === "link") return `הלקוח/ה בחר/ה מועד דרך קישור, אצל ${after.agent}`;
      if (after.mode === "manual") return `בחירת סוכן ידנית: ${after.agent ?? ""}`;
      if (after.mode === "spouse") return `פגישה זוגית אצל ${after.agent ?? ""}`;
      return after.agent ? `הקצאה אוטומטית ל${after.agent}` : "";
    case "rescheduled":
      return `מ-${when(before.start)} ל-${when(after.start)}`;
    case "cancelled":
      return [CANCEL_LABEL[after.cancelled_by], after.reason].filter(Boolean).join(" ● ");
    case "transferred":
      return `מ${before.agent} ל${after.agent}`;
    case "email_changed":
      return `${before.email ?? "—"} ← ${after.email}`;
    case "forced":
      return `המועד נקבע ללא בדיקת זמינות: ${when(after.start)}`;
    default:
      return "";
  }
}

const ROLE_ACTOR: Record<string, string> = { customer_link: "לקוח/ה בקישור", system: "המערכת" };

export function BookingDetailScreen({ booking, events }: { booking: BookingRow; events: BookingEvent[] }) {
  const router = useRouter();
  const common = useCommonVM();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBy, setCancelBy] = useState("coordinator");
  const [cancelReason, setCancelReason] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailWho, setEmailWho] = useState("primary");
  const [emailNew, setEmailNew] = useState("");
  const [busy, setBusy] = useState(false);

  const status = statusOf(booking);
  const onsite = !!booking.in_person_address;
  const joint = !!booking.spouse_booking_id || !!booking.additional_lead_number;
  const isPast = status === "done";
  const active = status === "planned" || status === "done";
  const upcoming = status === "planned";

  const facts = [
    ["סוכן/ת", booking.agent_name, "rtl"],
    ["לקוח/ה", booking.customer_name, "rtl"],
    ["מספר ליד", booking.lead_number, "ltr"],
    [isPast ? "מייל בעת הקביעה" : "מייל הלקוח/ה", booking.customer_email ?? "—", "ltr"],
    ["טלפון", booking.customer_phone ?? "—", "ltr"],
    ...(joint
      ? [
          ["בן/בת זוג", `${booking.additional_customer_name ?? "—"} - ${booking.additional_lead_number ?? ""}`, "rtl"],
          [isPast ? "מייל בן/בת הזוג בעת הקביעה" : "מייל בן/בת הזוג", booking.additional_customer_email ?? "—", "ltr"],
        ]
      : []),
    ["מקום", booking.in_person_address ?? "מרחוק", "rtl"],
    ...(booking.notes ? [["הערה", booking.notes, "rtl"]] : []),
    ["נקבעה על ידי", `${booking.booked_by_name ?? (booking.source === "link" ? "לקוח/ה בקישור" : "—")} ● ${fmtDate(booking.created_at)}`, "rtl"],
    ...(booking.status === "cancelled"
      ? [["בוטלה על ידי", `${booking.cancelled_by_name ?? "—"} ● ${CANCEL_LABEL[booking.cancelled_by ?? ""] ?? ""}${booking.cancel_reason ? ` ● ${booking.cancel_reason}` : ""}`, "rtl"]]
      : []),
  ];

  async function run(action: () => Promise<unknown>, success: [string, string?], close: () => void) {
    setBusy(true);
    try {
      await action();
      close();
      toast(success[0], success[1]);
      router.refresh();
    } catch (failure) {
      toast("הפעולה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  }

  const v = {
    ...common,
    goBookings: () => router.push("/admin"),
    cardFill: { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 } },
    dTime: fmtRange(booking.start_at, booking.end_at),
    dDow: fmtDow(booking.start_at),
    dDate: fmtDate(booking.start_at),
    dTone: STATUS[status][0],
    dIcon: STATUS[status][1],
    dLabel: STATUS[status][2],
    dAssign: booking.forced ? "קביעה כפויה" : booking.assignment_mode === "manual" ? "בחירה ידנית" : booking.assignment_mode === "spouse" ? "לפי בן/בת הזוג" : "הקצאה אוטומטית",
    detailJoint: joint,
    meetingFacts: facts.map(([label, value, dir], index) => ({ label, value, dir, rowStyle: factRow(index === facts.length - 1) })),
    teamsFull: onsite ? null : <TeamsLink url={booking.teams_join_url} state={teamsState(booking)} variant="full" />,
    detailActDesk: active && !common.isPhone,
    detailActPhone: active && common.isPhone,
    detailNotPast: upcoming,
    goReschedule: () => router.push(`/admin/bookings/${booking.id}/reschedule`),
    goTransfer: () => router.push(`/admin/bookings/${booking.id}/transfer`),
    openCustEmail: () => {
      setEmailOpen(true);
      setEmailNew("");
      setEmailWho("primary");
    },
    openCancel: () => setCancelOpen(true),
    history: [...events].reverse().map((event) => {
      const view = EVENT_VIEW[event.action] ?? { action: event.action, icon: "info", bg: "var(--gray-100)", fg: "var(--gray-600)" };
      return {
        id: event.id,
        ...view,
        detail: eventDetail(event),
        when: `${fmtDate(event.created_at)} ${fmtTime(event.created_at)}`,
        actor: event.actor_name ?? ROLE_ACTOR[event.actor_role] ?? "המערכת",
      };
    }),
    cancelOpen,
    closeCancel: () => setCancelOpen(false),
    cancelDesc: `${whenText(booking)} ● ${booking.customer_name} ● ${booking.agent_name}`,
    cancelByOptions: CANCEL_BY_OPTIONS,
    cancelBy,
    onCancelBy: setCancelBy,
    cancelReason,
    onCancelReason: (event: Change) => setCancelReason(event.target.value),
    cancelFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          variant="destructive"
          size="md"
          iconStart="x"
          loading={busy}
          disabled={!cancelReason.trim()}
          onClick={() => run(() => api(`/api/app/bookings/${booking.id}/cancel`, { cancelledBy: cancelBy, reason: cancelReason.trim() }), ["הפגישה בוטלה", "הודעה נשלחה ללקוח/ה ולסוכן/ת."], () => setCancelOpen(false))}
        >
          ביטול הפגישה
        </Button>
        <Button variant="ghost" size="md" onClick={() => setCancelOpen(false)}>
          חזרה
        </Button>
      </div>
    ),
    custEmailOpen: emailOpen,
    closeCustEmail: () => setEmailOpen(false),
    emailDesc: whenText(booking),
    custEmailWho: emailWho,
    onCustEmailWho: setEmailWho,
    custEmailWhoOptions: [
      { value: "primary", label: booking.customer_name, description: booking.customer_email ?? "" },
      { value: "additional", label: booking.additional_customer_name ?? "", description: booking.additional_customer_email ?? "" },
    ],
    custEmailCurrent: (emailWho === "additional" ? booking.additional_customer_email : booking.customer_email) ?? "",
    custEmailNew: emailNew,
    onCustEmailNew: (event: Change) => setEmailNew(event.target.value),
    custEmailFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          size="md"
          iconStart="check"
          loading={busy}
          disabled={!emailNew.trim()}
          onClick={() => run(() => api(`/api/app/bookings/${booking.id}/email`, { which: emailWho, email: emailNew.trim() }), ["מייל הלקוח/ה עודכן", `הזמנה חדשה נשלחה ל-${emailNew.trim()}, והמייל הקודם קיבל הודעת ביטול.`], () => setEmailOpen(false))}
        >
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
      <BookingDetailView v={v} />
      <CancelOpen0 v={v} />
      <CustEmailOpen3 v={v} />
    </>
  );
}

export function StaffPickerScreen({
  mode,
  booking,
  agentOptions,
  durationMin,
  windowDays,
}: {
  mode: "reschedule" | "transfer";
  booking: BookingRow;
  agentOptions: { value: string; label: string }[];
  durationMin: number;
  windowDays: number;
}) {
  const router = useRouter();
  const common = useCommonVM();
  const toast = useToast();
  const [agentId, setAgentId] = useState("");
  const [loadKey, setLoadKey] = useState(mode === "reschedule" ? "go" : "");
  const [forced, setForced] = useState(false);
  const [forceDate, setForceDate] = useState<Date | null>(null);
  const [forceTime, setForceTime] = useState("");
  const [forceErr, setForceErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const wall = { date: isoDate(localDate(fmtDate(booking.start_at).split(".").reverse().join("-"))), time: fmtTime(booking.start_at) };
  const picker = useSlotPicker(
    loadKey
      ? async () => {
          if (mode === "reschedule") return (await api<{ slots: Record<string, string[]> }>(`/api/app/bookings/${booking.id}/slots`, {})).slots;
          return (await api<{ slots: Record<string, string[]> }>(`/api/app/bookings/${booking.id}/transfer-slots`, { agentId })).slots;
        }
      : null,
    { durationMin, preselect: mode === "transfer" ? wall : null },
  );

  useEffect(() => {
    if (mode !== "transfer") return;
    if (agentId) void picker.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  async function confirm(date: string, time: string, isForced: boolean) {
    setBusy(true);
    setForceErr("");
    const url = mode === "reschedule" ? `/api/app/bookings/${booking.id}/reschedule` : `/api/app/bookings/${booking.id}/transfer`;
    try {
      await api(url, mode === "reschedule" ? { date, time, forced: isForced } : { agentId, date, time, forced: isForced });
      toast(mode === "reschedule" ? "המועד עודכן" : "הפגישה הועברה", "הלקוח/ה קיבל/ה הזמנה מעודכנת.");
      router.push(`/admin/bookings/${booking.id}`);
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "slot_taken" && !isForced) await picker.markTaken();
      else if (failure instanceof ApiFailure && isForced && failure.status < 500) setForceErr(failure.message);
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const back = () => router.push(`/admin/bookings/${booking.id}`);
  const whenLabel = `${fmtDow(booking.start_at)} ${fmtDate(booking.start_at)} בשעה ${fmtTime(booking.start_at)}`;
  const onsite = !!booking.in_person_address;
  const waiting = mode === "transfer" && !agentId;

  const v = {
    ...common,
    goBookings: back,
    newHeaderMax: "880px",
    newStep: 3,
    newLabels: ["פרטי הליד", "הקצאת סוכן", "בחירת מועד"],
    newSub: mode === "reschedule" ? "בחר מועד חדש לפגישה" : "בחר סוכן/ת ומועד",
    newStep3: true,
    pickerAgent: mode === "reschedule" ? booking.agent_name : "העברה לסוכן/ת אחר/ת",
    pickerHint: forced ? "הזן מועד ידנית" : mode === "reschedule" ? "שינוי מועד לפגישה קיימת" : "בחר סוכן/ת ומועד",
    durationLabel: `${durationMin} דקות`,
    locationTone: onsite ? "purple" : "brand",
    locationIcon: onsite ? "map-pin" : "phone",
    meetingKind: onsite ? "פגישה פרונטלית" : "פגישה מרחוק",
    pkTransfer: mode === "transfer",
    agentPickOptions: agentOptions,
    transferAgent: agentId,
    onTransferAgent: (value: string) => {
      setAgentId(value);
      setLoadKey("go");
    },
    pkTransferText: `המועד הקיים של הפגישה, ${whenLabel}, ייבחר מראש אם הסוכן/ת החדש/ה פנוי/ה בו. פגישה זוגית עוברת יחד עם בן/בת הזוג.`,
    pkReschedule: mode === "reschedule",
    pkRescheduleText: `אותו/אותה סוכן/ת ואותה פגישה. המועד הקיים, ${whenLabel}, נשאר זמין כדי שאפשר יהיה להשאיר אותו.`,
    pkForced: forced && !failed,
    forceField: <DateField value={forceDate} onChange={setForceDate} placeholder="בחירת תאריך" />,
    forceTime,
    onForceTime: (event: Change) => setForceTime(event.target.value),
    forceErr,
    newForceConfirm: () => {
      if (!forceDate || !forceTime) return setForceErr("יש לבחור תאריך ושעה");
      void confirm(isoDate(forceDate), forceTime, true);
    },
    newBack: () => (forced ? setForced(false) : back()),
    confirmBusy: busy,
    pkLoading: !forced && !failed && !waiting && picker.state === "loading",
    pkEmpty: !forced && !failed && !waiting && picker.state === "empty",
    pkEmptyText: `לא נמצאו מועדים פנויים ב-${windowDays} הימים הקרובים. אפשר לבחור סוכן/ת אחר/ת, או לקבוע מועד כפוי בתיאום טלפוני.`,
    showForcedNew: () => setForced(true),
    gridForce: true,
    pkError: failed || (!forced && !waiting && picker.state === "error"),
    pkRetry: () => {
      setFailed(false);
      void picker.refresh();
    },
    pkGrid: !forced && !failed && !waiting && picker.state === "grid",
    pkTaken: !!picker.taken,
    pkTakenText: `${picker.taken} אינו פנוי יותר. השעות הפנויות רועננו — בחר מועד אחר.`,
    newDate: picker.date,
    pickNewDate: picker.pickDate,
    todayDate: new Date(),
    availableDates: picker.availableDates,
    newDateLabel: picker.date ? formatDate(picker.date) : "בחר יום ביומן",
    slotCount: picker.countLabel,
    newSlots: picker.times,
    newSlot: picker.time,
    pickNewSlot: picker.pickTime,
    noSlot: !picker.time,
    confirmLabel: picker.confirmLabel,
    newConfirm: () => confirm(picker.dateKey, picker.time, false),
  };

  return <NewBookingView v={v} />;
}

export interface AlertItem {
  id: string;
  kind: string;
  agentName: string | null;
  agentId: string | null;
  bookingId: string | null;
  customer: string | null;
  start: string | null;
  createdAt: string;
}

const SEVERITY = {
  urgent: { card: { background: "var(--red-50)" }, circle: { background: "var(--status-error)", color: "#fff" } },
  warn: { card: { background: "#fff" }, circle: { background: "var(--amber-100)", color: "var(--status-warning)" } },
};

export function AlertsScreen({ alerts }: { alerts: AlertItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const common = useCommonVM();

  const when = (iso: string | null) => (iso ? `${fmtDate(iso).slice(0, 5)} בשעה ${fmtTime(iso)}` : "");

  const items = alerts.map((alert) => {
    const copy =
      alert.kind === "calendar_unreadable"
        ? {
            sev: "urgent" as const,
            icon: "alert-circle",
            title: `היומן של ${alert.agentName} לא נגיש`,
            detail: `החיבור ל-Outlook התנתק. עד להתחברות מחדש, ${alert.agentName} לא יוצע/תוצע בתיאום פגישות חדשות.`,
            action: "שליחת קישור התחברות",
            actionIcon: "mail",
          }
        : alert.kind === "no_outlook_event"
          ? {
              sev: "warn" as const,
              icon: "alert-triangle",
              title: "לא נוצרה פגישה ביומן",
              detail: `הפגישה של ${alert.customer} ב-${when(alert.start)} לא נוספה ליומן של ${alert.agentName}.`,
              action: "פתיחת הפגישה",
              actionIcon: "search",
            }
          : {
              sev: "warn" as const,
              icon: "alert-triangle",
              title: "אין קישור Teams",
              detail: `הפגישה המקוונת של ${alert.customer} ב-${when(alert.start)} נוצרה ביומן של ${alert.agentName} ללא קישור Teams.`,
              action: "פתיחת הפגישה",
              actionIcon: "search",
            };
    return {
      id: alert.id,
      ...copy,
      when: `${fmtDate(alert.createdAt)} ${fmtTime(alert.createdAt)}`,
      cardStyle: { borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-lg)", padding: 24, ...SEVERITY[copy.sev].card },
      circleStyle: { width: 42, height: 42, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", ...SEVERITY[copy.sev].circle },
      act: async () => {
        if (alert.kind === "calendar_unreadable" && alert.agentId) {
          try {
            await api(`/api/app/agents/${alert.agentId}/calendar-link`, {});
            toast("הקישור נשלח", `${alert.agentName} קיבל/ה מייל עם קישור התחברות.`);
          } catch (failure) {
            toast("השליחה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
          }
        } else if (alert.bookingId) {
          router.push(`/admin/bookings/${alert.bookingId}`);
        }
      },
      dismiss: async () => {
        await api(`/api/app/alerts/${alert.id}/resolve`, {});
        toast("ההתראה סומנה כטופלה", copy.title);
        router.refresh();
      },
    };
  });

  return (
    <AlertsView
      v={{
        ...common,
        alerts: items,
        alertActionsStyle: common.isPhone ? { display: "flex", gap: 12, alignItems: "center", justifyContent: "center", width: "100%" } : { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
      }}
    />
  );
}
