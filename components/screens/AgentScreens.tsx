"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, EmptyState } from "@/components/ds";
import { AgCancelOpen0 } from "@/components/views/agent/dialogs/AgCancelOpen0";
import { AgExcOpen1 } from "@/components/views/agent/dialogs/AgExcOpen1";
import { AgentHoursView } from "@/components/views/agent/HoursView";
import { AgentMeetingDetailView } from "@/components/views/agent/MeetingDetailView";
import { AgentMeetingsView } from "@/components/views/agent/MeetingsView";
import { AgentOverridesView } from "@/components/views/agent/OverridesView";
import { AgentRescheduleView } from "@/components/views/agent/RescheduleView";
import { TeamsLink, teamsState } from "@/components/views/TeamsLink";
import { useToast } from "@/components/shell/ToastProvider";
import type { BookingRow } from "@/lib/booking/types";
import { api, ApiFailure } from "@/lib/client/api";
import { CANCEL_BY_OPTIONS, whenText } from "@/lib/client/bookingView";
import { addMinutes, dotted, fmtDate, fmtDow, fmtRange, fmtTime } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";
import { useSlotPicker } from "@/lib/client/useSlotPicker";
import { factRow } from "./NewBookingScreen";
import { overrideRows, useHoursEditor, useOverrideEditor, type HolidayRow, type HourRow, type OverrideRow } from "./scheduleEditors";

const monthName = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", month: "long" }).format(new Date(iso));
const dayNumber = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric" }).format(new Date(iso));

const CANCELLED_BY: Record<string, string> = { customer: "לקוח/ה", agent: "סוכן/ת", coordinator: "מתאמת" };
const cancelledWhen = (row: BookingRow) => (row.cancelled_at ? `${fmtDate(row.cancelled_at)} ${fmtTime(row.cancelled_at)}` : "—");
const hasEnded = (row: BookingRow) => new Date(row.end_at).getTime() < Date.now();

type MeetingsTab = "upcoming" | "past" | "cancelled";

export function AgentMeetingsScreen({ meetings, past, cancelled, initialTab }: { meetings: BookingRow[]; past: BookingRow[]; cancelled: BookingRow[]; initialTab: MeetingsTab }) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const showCancelled = tab === "cancelled";
  const showPast = tab === "past";
  const agMeetings = (showCancelled ? cancelled : showPast ? past : meetings).map((row) => {
    const onsite = !!row.in_person_address;
    const join = onsite || showCancelled || showPast ? null : <TeamsLink url={row.teams_join_url} state={teamsState(row)} variant="join" />;
    const cxLink = showCancelled && !onsite ? <TeamsLink url={row.teams_join_url} state="cancelled" variant="inline" /> : null;
    return {
      id: row.id,
      go: () => router.push(`/agent/meetings/${row.id}`),
      day: fmtDow(row.start_at),
      dayNum: dayNumber(row.start_at),
      month: monthName(row.start_at),
      time: fmtRange(row.start_at, row.end_at),
      customer: row.customer_name,
      joint: row.profile === "spouse" || !!row.spouse_booking_id,
      kind: onsite ? "פגישה פרונטלית" : "פגישה מרחוק",
      icon: onsite ? "map-pin" : "phone",
      kindColor: onsite ? "var(--purple-500)" : "var(--teal-700)",
      kindBg: onsite ? "var(--purple-50)" : "var(--teal-50)",
      onsite,
      address: row.in_person_address,
      topic: row.interest_name,
      join,
      hasJoin: !!join,
      cx: showCancelled,
      cxBy: CANCELLED_BY[row.cancelled_by ?? ""] ?? null,
      cxWhen: row.cancelled_at ? cancelledWhen(row) : null,
      cxReason: row.cancel_reason || null,
      cxLink,
      cxHasLink: !!cxLink,
    };
  });
  return (
    <>
      <AgentMeetingsView
        v={{
          agMeetings,
          agSub: meetings.length ? `${meetings.length} פגישות קרובות` : "אין פגישות קרובות",
          rowCardProps: { style: { cursor: "pointer", overflow: "hidden" } },
          agMtTabs: [
            { value: "upcoming", label: "עתידיות", count: meetings.length },
            { value: "past", label: "עברו" },
            { value: "cancelled", label: "מבוטלות", count: cancelled.length },
          ],
          agMtTab: tab,
          onAgMtTab: (value: MeetingsTab) => {
            setTab(value);
            router.replace(value === "upcoming" ? "/agent" : `/agent?tab=${value}`, { scroll: false });
          },
          agCxEmpty: showCancelled && cancelled.length === 0,
        }}
      />
      {tab === "upcoming" && meetings.length === 0 && (
        <Card padding="lg">
          <EmptyState icon="calendar" title="אין פגישות קרובות" description="פגישות חדשות שייקבעו לך יופיעו כאן." />
        </Card>
      )}
      {showPast && past.length === 0 && (
        <Card padding="lg">
          <EmptyState icon="calendar" title="אין פגישות שעברו" description="פגישות שמועדן עבר יופיעו כאן." />
        </Card>
      )}
    </>
  );
}

export function AgentMeetingDetailScreen({ booking }: { booking: BookingRow }) {
  const router = useRouter();
  const common = useCommonVM();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [by, setBy] = useState("agent");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const onsite = !!booking.in_person_address;
  const active = booking.status === "confirmed";
  const ended = active && hasEnded(booking);

  async function cancel() {
    setBusy(true);
    try {
      await api(`/api/app/bookings/${booking.id}/cancel`, { cancelledBy: by, reason: reason.trim() });
      setOpen(false);
      toast("הפגישה בוטלה");
      router.refresh();
    } catch (failure) {
      toast("הביטול נכשל", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  }

  const v = {
    ...common,
    goAgMeetings: () => router.push(!active ? "/agent?tab=cancelled" : ended ? "/agent?tab=past" : "/agent"),
    goAgReschedule: () => router.push(`/agent/meetings/${booking.id}/reschedule`),
    openAgCancel: () => setOpen(true),
    canAct: active,
    dTime: fmtRange(booking.start_at, booking.end_at),
    dWhen: `${fmtDow(booking.start_at)} ● ${fmtDate(booking.start_at)}`,
    ftTone: !active ? "error" : ended ? "neutral" : "success",
    ftIcon: !active ? "x" : ended ? "check" : "check-circle",
    ftLabel: !active ? "בוטלה" : ended ? "התקיימה" : "מתוכננת",
    summaryBox: { textAlign: "start", padding: "4px 20px" },
    dCustomer: booking.customer_name,
    dLead: booking.lead_number,
    dPhone: booking.customer_phone ?? "—",
    dKind: onsite ? `פגישה פרונטלית ● ${booking.in_person_address}` : "פגישה מרחוק",
    dTopic: booking.interest_name ?? "—",
    dNote: booking.notes,
    teamsFull: onsite ? null : <TeamsLink url={booking.teams_join_url} state={teamsState(booking)} variant="full" />,
    agDCx: !active,
    agDCxBy: CANCELLED_BY[booking.cancelled_by ?? ""] ?? "—",
    agDCxWhen: cancelledWhen(booking),
    agDCxReason: booking.cancel_reason || "—",
    agCancelOpen: open,
    closeAgCancel: () => setOpen(false),
    cancelDesc: `${whenText(booking)} ● ${booking.customer_name}`,
    cancelByOptions: CANCEL_BY_OPTIONS,
    agCancelBy: by,
    onAgCancelBy: setBy,
    agCancelReason: reason,
    onAgCancelReason: (event: { target: { value: string } }) => setReason(event.target.value),
    agCancelFooter: (
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-start" }}>
        <Button variant="destructive" size="md" iconStart="x" loading={busy} disabled={!reason.trim()} onClick={cancel}>
          ביטול הפגישה
        </Button>
        <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
          חזרה
        </Button>
      </div>
    ),
  };
  return (
    <>
      <AgentMeetingDetailView v={v} />
      <AgCancelOpen0 v={v} />
    </>
  );
}

export function AgentRescheduleScreen({ booking, durationMin, windowDays }: { booking: BookingRow; durationMin: number; windowDays: number }) {
  const router = useRouter();
  const common = useCommonVM();
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const currentTime = fmtTime(booking.start_at);
  const currentDate = fmtDate(booking.start_at);

  const picker = useSlotPicker(
    async () => (await api<{ slots: Record<string, string[]> }>(`/api/app/bookings/${booking.id}/slots`, {})).slots,
    { durationMin },
  );
  const isCurrent = !!picker.time && dotted(picker.dateKey) === currentDate && picker.time === currentTime;

  async function confirm() {
    if (isCurrent) return router.push(`/agent/meetings/${booking.id}`);
    setBusy(true);
    try {
      await api(`/api/app/bookings/${booking.id}/reschedule`, { date: picker.dateKey, time: picker.time, forced: false });
      setDone({ date: picker.dateKey, time: picker.time });
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "slot_taken") await picker.markTaken();
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const facts = done
    ? [
        { label: "לקוח/ה", value: booking.customer_name, dir: "rtl" },
        { label: "מועד חדש", value: `${done.time} - ${addMinutes(done.time, durationMin)} ● ${dotted(done.date)}`, dir: "ltr" },
      ].map((row, index, rows) => ({ ...row, rowStyle: factRow(index === rows.length - 1) }))
    : [];

  return (
    <AgentRescheduleView
      v={{
        ...common,
        goAgDetail: () => router.push(`/agent/meetings/${booking.id}`),
        goAgMeetings: () => router.push("/agent"),
        resTitle: `${booking.customer_name} ● ${fmtDow(booking.start_at)} `,
        resWhen: `${currentDate}, ${fmtRange(booking.start_at, booking.end_at)}`,
        agResPad: common.isPhone ? "md" : "lg",
        agResLoading: !done && !failed && picker.state === "loading",
        agResEmpty: !done && !failed && picker.state === "empty",
        resEmptyText: `לא נמצאו מועדים פנויים ב-${windowDays} הימים הקרובים. אפשר להשאיר את המועד הנוכחי, או לפנות למוקד.`,
        agResError: !done && (failed || picker.state === "error"),
        agResRetry: () => {
          setFailed(false);
          void picker.refresh();
        },
        agResDone: !!done,
        agResFacts: facts,
        resDoneText: `${booking.customer_name} קיבל/ה הזמנה מעודכנת במייל.`,
        agResGrid: !done && !failed && picker.state === "grid",
        agResTaken: !!picker.taken,
        resTakenText: `${picker.taken} אינו פנוי יותר. השעות הפנויות רועננו — בחר/י מועד אחר.`,
        agResDate: picker.date,
        pickAgResDate: picker.pickDate,
        todayDate: new Date(),
        agResDates: picker.availableDates,
        agResDateLabel: picker.dateLabel,
        agResCount: picker.countLabel,
        agResSlots: picker.times,
        agResSlot: picker.time,
        pickAgResSlot: picker.pickTime,
        agResShowCurrent: dotted(picker.dateKey) === currentDate && picker.times.includes(currentTime),
        resCurrentTime: currentTime,
        agResNoSlot: !picker.time,
        agResBusy: busy,
        agResCta: !picker.time ? "בחר/י מועד" : isCurrent ? "השארת המועד הנוכחי" : `אישור מועד ${picker.time} - ${addMinutes(picker.time, durationMin)}`,
        agResConfirm: confirm,
      }}
    />
  );
}

export function AgentHoursScreen({ hours }: { hours: HourRow[] }) {
  const common = useCommonVM();
  const editor = useHoursEditor(hours, undefined, ["השעות נשמרו", "המועדים הפנויים שלך עודכנו."]);
  return <AgentHoursView v={{ ...common, ...editor, flex1: { flex: 1 } }} />;
}

export function AgentOverridesScreen({ overrides, holidays }: { overrides: OverrideRow[]; holidays: HolidayRow[] }) {
  const common = useCommonVM();
  const editor = useOverrideEditor(undefined);
  const v = {
    ...common,
    ...editor.vm,
    overrides: overrideRows(overrides, holidays, editor.remove),
    openAgExc: editor.open,
    agExcKindOptions: [
      { value: "block", label: "חסימה", description: "לא ניתן לקבוע לך פגישות במועדים האלה" },
      { value: "open", label: "פתיחה", description: "פתיחת מועדים מחוץ לשעות הפעילות הרגילות" },
    ],
    agExcFooter: editor.vm.excFooter,
  };
  return (
    <>
      <AgentOverridesView v={v} />
      <AgExcOpen1 v={v} />
    </>
  );
}
