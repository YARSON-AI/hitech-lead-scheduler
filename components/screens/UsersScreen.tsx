"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ds";
import { GLYPH, QuietButton } from "@/components/views/bits";
import { AddCoordOpen1 } from "@/components/views/staff/dialogs/AddCoordOpen1";
import { DeactOpen2 } from "@/components/views/staff/dialogs/DeactOpen2";
import { UsersView } from "@/components/views/staff/UsersView";
import { useToast } from "@/components/shell/ToastProvider";
import { api, ApiFailure } from "@/lib/client/api";
import { useCommonVM } from "@/lib/client/hooks";
import type { AccountStatus, UserRow } from "@/lib/auth/accounts";

const STATUS: Record<AccountStatus, [string, string | undefined, string]> = {
  none: ["neutral", undefined, "ללא חשבון"],
  invited: ["info", "mail", "הוזמן/ה"],
  active: ["success", "check-circle", "פעיל/ה"],
  deactivated: ["error", "x", "מושבת/ת"],
};

const ROLE_LABEL = { agent: "סוכן/ת", coordinator: "מתאמת", manager: "מנהלת תיאום" };

export function UsersScreen({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const common = useCommonVM();
  const [tab, setTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [deactivating, setDeactivating] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(user: UserRow) {
    try {
      if (user.userId) await api("/api/app/users/reinvite", { userId: user.userId });
      else await api("/api/app/users/invite", { rosterId: user.id });
      if (user.status === "none") toast("ההזמנה נשלחה", `${user.email} קיבל/ה קישור להגדרת סיסמה.`);
      else if (user.status === "active") toast("הקישור נשלח", `${user.email} קיבל/ה קישור להגדרת סיסמה חדשה.`);
      else if (user.status === "deactivated") toast("ההזמנה נשלחה", `הגישה תחזור אחרי הגדרת סיסמה בקישור שנשלח ל-${user.email}.`);
      else toast("ההזמנה נשלחה שוב", `${user.email} קיבל/ה קישור חדש להגדרת סיסמה.`);
      router.refresh();
    } catch (failure) {
      toast("הפעולה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    }
  }

  async function addCoordinator() {
    const email = addEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setAddError("יש להזין כתובת מייל תקינה");
    setBusy(true);
    try {
      await api("/api/app/users/coordinator", { email });
      setAddOpen(false);
      setAddEmail("");
      setTab("all");
      toast("ההזמנה נשלחה", `${email} קיבל/ה קישור להגדרת סיסמה.`);
      router.refresh();
    } catch (failure) {
      setAddError(failure instanceof ApiFailure ? failure.message : "משהו השתבש. נסה/י שוב.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivating?.userId) return;
    setBusy(true);
    try {
      await api("/api/app/users/deactivate", { userId: deactivating.userId });
      toast("המשתמש/ת הושבת/ה", `${deactivating.name} לא יוכל/תוכל להיכנס למערכת.`);
      setDeactivating(null);
      router.refresh();
    } catch (failure) {
      toast("הפעולה נכשלה", failure instanceof ApiFailure ? failure.message : undefined, "error");
    } finally {
      setBusy(false);
    }
  }

  const actions = (user: UserRow, spread: boolean) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: spread ? "space-between" : "flex-end", width: "100%" }}>
      {user.status === "none" ? (
        <QuietButton paths={GLYPH.SEND} label="שליחת הזמנה" onClick={() => send(user)} />
      ) : (
        <QuietButton paths={GLYPH.RESEND} label="שליחה מחדש" onClick={() => send(user)} />
      )}
      {user.status === "active" && !user.self && <QuietButton paths={GLYPH.BAN} label="השבתה" onClick={() => setDeactivating(user)} tone="danger" />}
    </div>
  );

  const filtered = rows.filter((user) => tab === "all" || (tab === "agents" ? user.kind === "agent" : user.kind !== "agent"));
  const userRows = filtered.map((user) => ({
    ...user,
    role: ROLE_LABEL[user.kind],
    badge: (
      <Badge tone={STATUS[user.status][0]} icon={STATUS[user.status][1]} size="sm">
        {STATUS[user.status][2]}
      </Badge>
    ),
    actions: actions(user, false),
    actionsSpread: actions(user, true),
  }));

  const v = {
    ...common,
    openAddCoord: () => {
      setAddOpen(true);
      setAddError("");
    },
    usersHasTabs: rows.length > 0,
    usersTabs: [
      { value: "all", label: "הכל", count: rows.length },
      { value: "agents", label: "סוכנים", count: rows.filter((user) => user.kind === "agent").length },
      { value: "coords", label: "מתאמות", count: rows.filter((user) => user.kind !== "agent").length },
    ],
    usersTab: tab,
    onUsersTab: setTab,
    usersError: false,
    usersEmpty: rows.length === 0,
    usersTableOn: userRows.length > 0,
    usersCardsOn: userRows.length > 0,
    userRows,
    userColumns: [
      { align: "center", key: "name", title: "שם", nowrap: true },
      { align: "center", key: "role", title: "תפקיד", nowrap: true },
      { align: "center", key: "email", title: "מייל", nowrap: true, render: (row: UserRow) => <span dir="ltr">{row.email}</span> },
      { align: "center", key: "st", title: "סטטוס", nowrap: true, render: (row: { badge: unknown }) => row.badge },
      { align: "end", key: "actions", title: "", nowrap: true, render: (row: { actions: unknown }) => row.actions },
    ],
    addCoordOpen: addOpen,
    closeAddCoord: () => setAddOpen(false),
    addCoordEmail: addEmail,
    onAddCoordEmail: (event: { target: { value: string } }) => {
      setAddEmail(event.target.value);
      setAddError("");
    },
    addCoordErr: addError,
    addCoordFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button size="md" iconStart="mail" loading={busy} onClick={addCoordinator}>
          שליחת הזמנה
        </Button>
        <Button variant="ghost" size="md" onClick={() => setAddOpen(false)}>
          ביטול
        </Button>
      </div>
    ),
    deactOpen: !!deactivating,
    closeDeact: () => setDeactivating(null),
    deactDesc: deactivating ? `${deactivating.name} ● ${deactivating.email}` : "",
    deactFooter: (
      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="destructive" size="md" iconStart="x" loading={busy} onClick={confirmDeactivate}>
          השבתה
        </Button>
        <Button variant="ghost" size="md" onClick={() => setDeactivating(null)}>
          ביטול
        </Button>
      </div>
    ),
  };

  return (
    <>
      <UsersView v={v} />
      <AddCoordOpen1 v={v} />
      <DeactOpen2 v={v} />
    </>
  );
}
