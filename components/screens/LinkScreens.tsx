"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button } from "@/components/ds";
import { GLYPH, Glyph, QuietButton } from "@/components/views/bits";
import { LinkNewView } from "@/components/views/links/LinkNewView";
import { LinksView } from "@/components/views/links/LinksView";
import { RevokeOpen8 } from "@/components/views/staff/dialogs/RevokeOpen8";
import { useToast } from "@/components/shell/ToastProvider";
import type { LinkListRow } from "@/lib/booking/links-read";
import { api, ApiFailure } from "@/lib/client/api";
import { fmtDate, fmtTime } from "@/lib/client/format";
import { useCommonVM, useCopy } from "@/lib/client/hooks";
import { factRow } from "./NewBookingScreen";

type Change = { target: { value: string } };
type Option = { value: string; label: string };

const LINK_GLYPH = '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
const XMARK = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';

export function LinkNewScreen({
  role,
  ownName,
  specializations,
  initialLead,
  listHref,
}: {
  role: "agent" | "staff";
  ownName?: string;
  specializations: Option[];
  initialLead?: string;
  listHref: string;
}) {
  const router = useRouter();
  const common = useCommonVM();
  const { copied, copy } = useCopy();
  const isAgent = role === "agent";
  const [lead, setLead] = useState(initialLead ?? "");
  const [address, setAddress] = useState("");
  const [leadErr, setLeadErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [customer, setCustomer] = useState<string | null>(null);
  const [assign, setAssign] = useState("auto");
  const [spec, setSpec] = useState("");
  const [agent, setAgent] = useState("");
  const [agents, setAgents] = useState<Option[]>([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ url: string; expiresAt: string; agentName: string | null } | null>(null);

  useEffect(() => {
    if (isAgent || assign !== "manual") return;
    const query = spec ? `?specialization=${encodeURIComponent(spec)}` : "";
    api<{ agents: Option[] }>(`/api/app/agents/options${query}`).then((result) => setAgents(result.agents)).catch(() => setAgents([]));
  }, [isAgent, assign, spec]);

  async function check() {
    if (!/^\d{1,20}$/.test(lead.trim())) return setLeadErr("יש להזין מספר ליד תקין");
    setBusy(true);
    setErr("");
    setLeadErr("");
    try {
      const result = await api<{ name: string }>("/api/app/links/check", { leadNumber: lead.trim() });
      setCustomer(result.name);
    } catch (failure) {
      if (failure instanceof ApiFailure && failure.code === "lead_not_found") setErr("הליד לא נמצא בשורנס. יש לבדוק את המספר.");
      else setErr("משהו השתבש בבדיקת הליד, נסה/י שוב.");
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setCreating(true);
    setErr("");
    try {
      const result = await api<{ url: string; expiresAt: string; agentName: string | null }>("/api/app/links", {
        leadNumber: lead.trim(),
        address: address.trim() || undefined,
        mode: isAgent || assign === "manual" ? "manual" : "auto",
        agentId: !isAgent && assign === "manual" ? agent : undefined,
        specialization: !isAgent && assign === "manual" && spec ? spec : undefined,
      });
      setCreated(result);
      router.refresh();
    } catch (failure) {
      setErr(failure instanceof ApiFailure ? failure.message : "משהו השתבש, נסה/י שוב.");
    } finally {
      setCreating(false);
    }
  }

  function restart() {
    setLead("");
    setAddress("");
    setCustomer(null);
    setCreated(null);
    setAgent("");
    setSpec("");
    setAssign("auto");
    setErr("");
  }

  const done = !!created;
  const isCopied = copied === "new";
  const facts: [string, string, string][] = [
    ["לקוח/ה", `${customer} - ${lead.trim()}`, "rtl"],
    !isAgent && assign === "auto" ? ["הקצאה", "אוטומטית", "rtl"] : ["סוכן/ת", created?.agentName ?? ownName ?? "", "rtl"],
    ["סוג פגישה", address.trim() ? "פגישה פרונטלית" : "פגישה אונליין", "rtl"],
  ];

  return (
    <LinkNewView
      v={{
        ...common,
        lkBack: () => router.push(listHref),
        lkBackLabel: "חזרה לקישורי הזמנה",
        lkStep: done ? 3 : customer ? 2 : 1,
        lkDone: done,
        lkForm: !done,
        lkLabels: ["פרטי הליד", "סוכן/ת", "קישור"],
        lkPad: common.isPhone ? "md" : "lg",
        lkLead: lead,
        onLkLead: (event: Change) => {
          setLead(event.target.value);
          setLeadErr("");
          setErr("");
        },
        lkLeadErr: leadErr,
        lkChecked: !!customer,
        lkAddress: address,
        onLkAddress: (event: Change) => setAddress(event.target.value),
        lkErr: err,
        lkNotChecked: !customer,
        lkBusy: busy,
        lkCheck: check,
        lkCheckCta: busy ? "בודק ליד..." : "בדיקת ליד",
        lkReset: () => setCustomer(null),
        lkCustomer: customer,
        lkAgentHint: isAgent ? "הקישור יהיה לפגישה איתך" : "בחר/י כיצד להקצות סוכן/ת לפגישה",
        lkStaff: !isAgent,
        lkIsAgent: isAgent,
        lkOwnName: ownName,
        lkAssignOptions: [
          { value: "auto", label: "הקצאה אוטומטית", description: "הלקוח/ה יראה/תראה את הזמנים הפנויים של כל הסוכנים המתאימים, והפגישה תוקצה לפי המועד שייבחר" },
          { value: "manual", label: "בחירת סוכן ידנית", description: "הלקוח/ה יראה/תראה רק את הזמנים הפנויים של הסוכן/ת שתבחר/י" },
        ],
        lkAssign: assign,
        onLkAssign: (value: string) => {
          setAssign(value);
          setAgent("");
          setSpec("");
        },
        lkManual: !isAgent && assign === "manual",
        specOptions: [{ value: "", label: "הכל" }, ...specializations],
        lkSpec: spec,
        onLkSpec: (value: string) => {
          setSpec(value);
          setAgent("");
        },
        agentPickOptions: agents,
        lkAgent: agent,
        onLkAgent: setAgent,
        lkCreateDisabled: !isAgent && assign === "manual" && !agent,
        lkCreating: creating,
        lkCreate: create,
        lkCreateCta: creating ? "יוצר קישור..." : "צור קישור",
        linkGlyph: <Glyph paths={LINK_GLYPH} size={20} />,
        lkUrl: created?.url,
        lkCopyBtn: (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => created && copy("new", created.url)}
            style={isCopied ? { borderColor: "var(--green-300)", background: "var(--green-600)", color: "#fff" } : undefined}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Glyph paths={isCopied ? GLYPH.CHECK : GLYPH.COPY} size={20} />
              {isCopied ? "הועתק" : "העתק קישור"}
            </span>
          </Button>
        ),
        lkExpiry: created ? `בתוקף עד ${fmtDate(created.expiresAt)}` : "",
        lkFacts: facts.map(([label, value, dir], index) => ({ label, value, dir, rowStyle: factRow(index === facts.length - 1) })),
        mt2: { marginTop: 2 },
        lkRestart: restart,
        goLinks: () => router.push(listHref),
      }}
    />
  );
}

const STATUS: Record<string, [string, string | undefined, string]> = {
  open: ["brand", undefined, "פתוח"],
  used: ["success", "check", "נוצלה"],
  revoked: ["neutral", "x", "בוטל"],
  expired: ["warning", "clock", "פג תוקף"],
};

export function LinksScreen({ role, rows, agentOptions, newHref }: { role: "agent" | "staff"; rows: LinkListRow[]; agentOptions: Option[]; newHref: string }) {
  const router = useRouter();
  const common = useCommonVM();
  const toast = useToast();
  const { copied, copy } = useCopy();
  const isAgent = role === "agent";
  const [tab, setTab] = useState("open");
  const [agentFilter, setAgentFilter] = useState("");
  const [revoking, setRevoking] = useState<(typeof rowsView)[number] | null>(null);
  const [busy, setBusy] = useState(false);
   
  const now = Date.now();

  const rowsView = rows.map((row) => {
    const status = row.status === "open" && new Date(row.expires_at).getTime() < now ? "expired" : row.status;
    return {
      ...row,
      status,
      auto: row.mode === "auto" && row.status !== "used",
      lead: row.lead_number,
      agentLabel: row.mode === "auto" && row.status !== "used" ? "אוטומטי" : (row.agent_name ?? ""),
      createdBy: row.created_by_name,
      createdAt: `${fmtDate(row.created_at)} ${fmtTime(row.created_at)}`,
      expires: fmtDate(row.expires_at),
    };
  });
  type Row = (typeof rowsView)[number];

  const onCopy = async (row: Row) => {
    try {
      const { url } = await api<{ url: string }>(`/api/app/links/${row.id}/copy`, {});
      copy(row.id, url);
    } catch (failure) {
      toast("ההעתקה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    }
  };

  const actions = (row: Row, spread: boolean) =>
    row.status === "open" ? (
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: spread ? "space-between" : "center", width: spread ? "100%" : undefined }}>
        <QuietButton paths={copied === row.id ? GLYPH.CHECK : GLYPH.COPY} label={copied === row.id ? "הועתק" : "העתקה"} tone={copied === row.id ? "done" : "neutral"} onClick={() => onCopy(row)} />
        <QuietButton paths={XMARK} label="ביטול" tone="danger" onClick={() => setRevoking(row)} />
      </div>
    ) : null;

  const badge = (status: string) => (
    <Badge tone={STATUS[status][0]} icon={STATUS[status][1]} size="sm">
      {STATUS[status][2]}
    </Badge>
  );
  const agentCell = (row: Row) => (row.auto ? <span style={{ color: "var(--text-tertiary)" }}>אוטומטי</span> : <span>{row.agent_name}</span>);
  const leadLink = (lead: string) => (
    <a href={`https://app.surense.com/leads/${lead}`} target="_blank" rel="noopener" dir="ltr" onClick={(event) => event.stopPropagation()} style={{ fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
      {lead}
    </a>
  );

  const openCount = rowsView.filter((row) => row.status === "open").length;
  const listed = rowsView
    .filter((row) => tab === "all" || row.status === "open")
    .filter((row) => !agentFilter || row.agent_email === agentFilter);

  const columns = [
    { align: "center", key: "lead", title: "מספר ליד", width: 90, render: (row: Row) => leadLink(row.lead) },
    ...(isAgent ? [] : [{ align: "center", key: "agent", title: "סוכן/ת", sortable: true, nowrap: true, width: 110, render: agentCell }]),
    { align: "center", key: "createdBy", title: 'נוצר ע"י', nowrap: true, width: 110 },
    { align: "center", key: "createdAt", title: "נוצר בתאריך", nowrap: true, width: 130, render: (row: Row) => <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{row.createdAt}</span> },
    { align: "center", key: "expires", title: "בתוקף עד", nowrap: true, width: 100, render: (row: Row) => <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{row.expires}</span> },
    { align: "center", key: "status", title: "סטטוס", nowrap: true, width: 100, render: (row: Row) => badge(row.status) },
    { align: "center", key: "actions", title: "", nowrap: true, width: 190, render: (row: Row) => actions(row, false) },
  ].map((column) => (isAgent ? { ...column, width: undefined } : column));

  async function revoke() {
    if (!revoking) return;
    setBusy(true);
    try {
      await api(`/api/app/links/${revoking.id}/revoke`, {});
      setRevoking(null);
      toast("הקישור בוטל", "הלקוח/ה לא יוכל/תוכל להשתמש בו יותר.");
      router.refresh();
    } catch (failure) {
      toast("הביטול נכשל", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  }

  const v = {
    ...common,
    lkListSub: isAgent ? "קישורים לבחירת מועד שנוצרו עבורך" : "קישורים לבחירת מועד שנשלחו ללקוחות",
    goLinkNew: () => router.push(newHref),
    lkTabs: [
      { value: "open", label: "פתוחים", count: openCount },
      { value: "all", label: "הכל" },
    ],
    lkTab: tab,
    onLkTab: setTab,
    lkStaff: !isAgent,
    lkFilterWrap: { width: common.isPhone ? "100%" : 240 },
    agentFilterOptions: [{ value: "", label: "כל הסוכנים" }, ...agentOptions],
    lkAgentFilter: agentFilter,
    onLkAgentFilter: setAgentFilter,
    lkEmpty: listed.length === 0,
    lkCqClass: isAgent ? "hti-cq-lka" : "hti-cq-lks",
    lkTableOn: listed.length > 0,
    lkCardsOn: listed.length > 0,
    lkScroll: { overflowX: "hidden", borderRadius: "var(--radius-control)" },
    linkColumns: columns,
    linkRows: listed.map((row) => ({
      ...row,
      isOpen: row.status === "open",
      badge: badge(row.status),
      leadUrl: `https://app.surense.com/leads/${row.lead}`,
      agentCell: agentCell(row),
      actions: actions(row, true),
    })),
    revokeOpen: !!revoking,
    closeRevoke: () => setRevoking(null),
    revokeDesc: revoking ? `ליד ${revoking.lead} ● ${revoking.auto ? "הקצאה אוטומטית" : revoking.agent_name} ● בתוקף עד ${revoking.expires}` : "",
    revokeFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="destructive" size="md" iconStart="x" loading={busy} onClick={revoke}>
          ביטול הקישור
        </Button>
        <Button variant="ghost" size="md" onClick={() => setRevoking(null)}>
          חזרה
        </Button>
      </div>
    ),
  };

  return (
    <>
      <LinksView v={v} />
      <RevokeOpen8 v={v} />
    </>
  );
}
