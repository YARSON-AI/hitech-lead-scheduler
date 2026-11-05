"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DateField } from "@/components/views/pickers";
import { NewBookingView } from "@/components/views/staff/NewBookingView";
import { TeamsLink } from "@/components/views/TeamsLink";
import { api, ApiFailure } from "@/lib/client/api";
import { fmtDate, fmtRange, isoDate } from "@/lib/client/format";
import { useCommonVM } from "@/lib/client/hooks";
import { useSlotPicker } from "@/lib/client/useSlotPicker";

type Change = { target: { value: string } };
type Option = { value: string; label: string };

interface Done {
  agentName: string;
  customerName: string;
  leadNumber: string;
  start: string;
  end: string;
  address: string | null;
  teamsJoinUrl: string | null;
}

const LEAD_ERROR = "מספר/י הליד/ים לא נמצאו, או שיש תקלה זמנית במערכת";

export function factRow(last: boolean) {
  return { display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 16, alignItems: "center", padding: "11px 0", borderBottom: last ? "none" : "1px solid var(--border-subtle)" };
}

export function NewBookingScreen({ specializations }: { specializations: Option[] }) {
  const router = useRouter();
  const common = useCommonVM();
  const [step, setStep] = useState(1);
  const [leadNum, setLeadNum] = useState("");
  const [leadErr, setLeadErr] = useState("");
  const [spouseOn, setSpouseOn] = useState(false);
  const [spouseLead, setSpouseLead] = useState("");
  const [inPerson, setInPerson] = useState(false);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [step1Err, setStep1Err] = useState("");
  const [lead, setLead] = useState<{ name: string; number: string } | null>(null);
  const [spouse, setSpouse] = useState<{ name: string; number: string } | null>(null);
  const [assign, setAssign] = useState("auto");
  const [spec, setSpec] = useState("");
  const [agent, setAgent] = useState("");
  const [agents, setAgents] = useState<Option[]>([]);
  const [forcedToggle, setForcedToggle] = useState(false);
  const [forceScreen, setForceScreen] = useState(false);
  const [forceDate, setForceDate] = useState<Date | null>(null);
  const [forceTime, setForceTime] = useState("");
  const [forceErr, setForceErr] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [duration, setDuration] = useState(30);
  const [windowDays, setWindowDays] = useState(21);
  const [pickerOn, setPickerOn] = useState(false);

  const mode = spouseOn ? "spouse" : assign;
  const assignment = () => ({
    mode,
    leadNumber: leadNum.trim(),
    agentId: mode === "manual" ? agent : undefined,
    specialization: mode === "manual" && spec ? spec : undefined,
    spouseLeadNumber: mode === "spouse" ? spouseLead.trim() : undefined,
  });

  const picker = useSlotPicker(
    pickerOn
      ? async () => {
          const result = await api<{ slots: Record<string, string[]>; durationMin: number; windowDays: number }>("/api/app/slots", assignment());
          setDuration(result.durationMin);
          setWindowDays(result.windowDays);
          return result.slots;
        }
      : null,
    { durationMin: duration },
  );

  useEffect(() => {
    if (assign !== "manual") return;
    const query = spec ? `?specialization=${encodeURIComponent(spec)}` : "";
    api<{ agents: Option[] }>(`/api/app/agents/options${query}`).then((result) => setAgents(result.agents)).catch(() => setAgents([]));
  }, [assign, spec]);

  async function next() {
    if (step === 1) {
      if (!/^\d{1,20}$/.test(leadNum.trim())) return setLeadErr("יש להזין מספר ליד תקין");
      if (spouseOn && !/^\d{1,20}$/.test(spouseLead.trim())) return setStep1Err(LEAD_ERROR);
      if (inPerson && !address.trim()) return setStep1Err("יש להזין כתובת");
      setBusy(true);
      setStep1Err("");
      try {
        const result = await api<{ lead: { name: string; number: string }; spouse?: { name: string; number: string } }>("/api/app/leads/check", {
          leadNumber: leadNum.trim(),
          spouseLeadNumber: spouseOn ? spouseLead.trim() : undefined,
        });
        setLead(result.lead);
        setSpouse(result.spouse ?? null);
        setStep(2);
      } catch (failure) {
        setStep1Err(failure instanceof ApiFailure ? failure.message : LEAD_ERROR);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 2) {
      setStep(3);
      setFailed(false);
      setForceScreen(forcedToggle && mode === "manual");
      setPickerOn(false);
      setTimeout(() => setPickerOn(true), 0);
    }
  }

  async function book(date: string, time: string, forced: boolean) {
    setConfirmBusy(true);
    setForceErr("");
    try {
      const result = await api<Done>("/api/app/bookings", { ...assignment(), address: inPerson ? address.trim() : undefined, date, time, forced });
      setDone(result);
      setStep(4);
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "slot_taken" && !forced) {
        await picker.markTaken();
      } else if (failure instanceof ApiFailure && forced && failure.status < 500) {
        setForceErr(failure.message);
      } else {
        setFailed(true);
      }
    } finally {
      setConfirmBusy(false);
    }
  }

  function restart() {
    setStep(1);
    setLeadNum("");
    setLeadErr("");
    setSpouseOn(false);
    setSpouseLead("");
    setInPerson(false);
    setAddress("");
    setAssign("auto");
    setAgent("");
    setSpec("");
    setForcedToggle(false);
    setForceScreen(false);
    setForceDate(null);
    setForceTime("");
    setStep1Err("");
    setDone(null);
    setFailed(false);
    setPickerOn(false);
  }

  const manualName = agents.find((option) => option.value === agent)?.label;
  const newSummary = done
    ? [
        { label: "סוכן/ת", value: done.agentName, dir: "rtl" },
        { label: "לקוח/ה", value: `${done.customerName} - ${done.leadNumber}`, dir: "rtl" },
        { label: "תאריך ושעה", value: `${fmtRange(done.start, done.end)} ● ${fmtDate(done.start)}`, dir: "ltr" },
        { label: done.address ? "כתובת" : "מיקום", value: done.address ?? "פגישה מרחוק", dir: "rtl" },
        ...(done.address ? [] : [{ label: "קישור Teams", value: <TeamsLink url={done.teamsJoinUrl} state={done.teamsJoinUrl ? "ready" : "missing"} variant="inline" />, dir: "rtl" }]),
      ].map((row, index, rows) => ({ ...row, rowStyle: factRow(index === rows.length - 1) }))
    : [];

  const v = {
    ...common,
    goBookings: () => router.push("/admin"),
    newHeaderMax: step === 3 ? "880px" : "600px",
    newStep: step,
    newLabels: ["פרטי הליד", "הקצאת סוכן", "בחירת מועד"],
    newSub: step === 3 ? "בחר מועד מהמועדים הפנויים" : "מלא את פרטי הליד, בחר סוכן וקבע מועד ביומן",
    newStep1: step === 1,
    newStep2: step === 2,
    newStep3: step === 3,
    newDone: step === 4,
    leadNum,
    onLeadNum: (event: Change) => {
      setLeadNum(event.target.value);
      setLeadErr("");
      setStep1Err("");
    },
    leadErr,
    newSpouse: spouseOn,
    spouseLead,
    onSpouseLead: (event: Change) => setSpouseLead(event.target.value),
    toggleSpouse: () => {
      setSpouseOn(!spouseOn);
      setSpouseLead("");
    },
    newInPerson: inPerson,
    notInPerson: !inPerson,
    toggleInPerson: () => {
      setInPerson(!inPerson);
      setAddress("");
    },
    newAddress: address,
    onNewAddress: (event: Change) => setAddress(event.target.value),
    step1Err,
    step1Cta: busy ? "מאמת פרטים..." : "המשך",
    newBusy: busy,
    newNext: next,
    newBack: () => {
      setPickerOn(false);
      setStep(step - 1);
    },
    leadSummary: lead ? `${lead.name} - ${lead.number}` : "",
    spouseSummary: spouse ? `${spouse.name} - ${spouse.number}` : "",
    meetingKind: inPerson ? "פגישה פרונטלית" : "פגישה מרחוק",
    locationTone: inPerson ? "purple" : "brand",
    locationIcon: inPerson ? "map-pin" : "phone",
    assignOptions: [
      { value: "auto", label: "הקצאה אוטומטית", description: "הפגישה תוקצה לסוכן זמין באופן אוטומטי" },
      { value: "manual", label: "בחירת סוכן ידנית", description: "בחר סוכן ספציפי לפגישה" },
    ],
    newAssign: assign,
    onNewAssign: (value: string) => {
      setAssign(value);
      setAgent("");
      setSpec("");
      setForcedToggle(false);
    },
    newManual: assign === "manual" && !spouseOn,
    specOptions: [{ value: "", label: "הכל" }, ...specializations],
    newSpec: spec,
    onNewSpec: (value: string) => {
      setSpec(value);
      setAgent("");
    },
    agentPickOptions: agents,
    newAgent: agent,
    onNewAgent: setAgent,
    newForced: forcedToggle,
    toggleForced: () => setForcedToggle(!forcedToggle),
    step2Disabled: mode === "manual" && !agent,
    pickerAgent: spouseOn ? "הסוכן/ת של בן/בת הזוג" : mode === "manual" ? (manualName ?? "") : "הקצאה אוטומטית",
    pickerHint: forceScreen ? "הזן מועד ידנית" : "בחר מועד מהיומן",
    durationLabel: `${duration} דקות`,
    pkForced: forceScreen && !failed,
    pkLoading: !forceScreen && !failed && picker.state === "loading",
    pkEmpty: !forceScreen && !failed && picker.state === "empty",
    pkEmptyText: `לא נמצאו מועדים פנויים ב-${windowDays} הימים הקרובים. אפשר לבחור סוכן/ת אחר/ת, או לקבוע מועד כפוי בתיאום טלפוני.`,
    pkError: failed || (!forceScreen && picker.state === "error"),
    pkRetry: () => {
      setFailed(false);
      void picker.refresh();
    },
    pkGrid: !forceScreen && !failed && picker.state === "grid",
    pkTaken: !!picker.taken,
    pkTakenText: `${picker.taken} אינו פנוי יותר. השעות הפנויות רועננו — בחר מועד אחר.`,
    pkTransfer: false,
    pkReschedule: false,
    showForcedNew: () => {
      if (mode === "manual") setForceScreen(true);
      else setStep(2);
    },
    forceField: <DateField value={forceDate} onChange={setForceDate} placeholder="בחירת תאריך" />,
    forceTime,
    onForceTime: (event: Change) => setForceTime(event.target.value),
    forceErr,
    newForceConfirm: () => {
      if (!forceDate || !forceTime) return setForceErr("יש לבחור תאריך ושעה");
      void book(isoDate(forceDate), forceTime, true);
    },
    confirmBusy,
    newDate: picker.date,
    pickNewDate: (date: Date) => {
      picker.setTaken(null);
      picker.pickDate(date);
    },
    todayDate: new Date(),
    availableDates: picker.availableDates,
    newDateLabel: picker.dateLabel,
    slotCount: picker.countLabel,
    newSlots: picker.times,
    newSlot: picker.time,
    pickNewSlot: picker.pickTime,
    noSlot: !picker.time,
    confirmLabel: picker.confirmLabel,
    newConfirm: () => book(picker.dateKey, picker.time, false),
    newToLink: () => router.push(`/admin/links/new?lead=${encodeURIComponent(leadNum.trim())}`),
    newSummary,
    newRestart: restart,
  };

  return <NewBookingView v={v} />;
}
