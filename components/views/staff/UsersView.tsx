"use client";

 
import { Fragment } from "react";
import { Button, Card, EmptyState, Table, Tabs } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function UsersView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ font: "var(--type-h1)" }}>
              משתמשים
            </h1>
            <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              סוכנים מרשימת הסוכנים ומתאמות, וסטטוס החשבון של כל אחד/ת
            </p>
          </div>
          <Button size="md" iconStart="user-plus" onClick={v.openAddCoord}>
            הוספת מתאמת
          </Button>
        </div>
        {v.usersHasTabs && (
          <>
            <Tabs variant="pills" tabs={v.usersTabs} value={v.usersTab} onChange={v.onUsersTab} />
          </>
        )}
        {v.usersError && (
          <>
            <Card padding="lg">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <EmptyState icon="alert-triangle" title="לא הצלחנו לטעון את רשימת המשתמשים" description="משהו השתבש. נסה/י שוב." />
                <Button variant="outline" size="md" onClick={v.usersRetry}>
                  נסה/י שוב
                </Button>
              </div>
            </Card>
          </>
        )}
        {v.usersEmpty && (
          <>
            <Card padding="lg">
              <EmptyState icon="users" title="אין משתמשים עדיין" description="סוכנים מרשימת הסוכנים יופיעו כאן אוטומטית. אפשר גם להוסיף מתאמת לפי מייל." />
            </Card>
          </>
        )}
        <div className={`hti-cq hti-cq-us ${v.cqMode}`}>
          {v.usersTableOn && (
            <>
              <div className="hti-cqt">
                <Card padding="none">
                  <div style={css(v.tableScroll)} className="hti-xscroll">
                    <Table columns={v.userColumns} rows={v.userRows} rowKey="id" />
                  </div>
                </Card>
              </div>
            </>
          )}
          {v.usersCardsOn && (
            <>
              <div style={{ flexDirection: "column", gap: "12px" }} className="hti-cqc">
                {(v.userRows ?? []).map((u: VM, index: number) => (
                  <Fragment key={u.key ?? u.id ?? index}>
                    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ minWidth: "0" }}>
                          <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                            {u.name}
                          </div>
                          <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                            {u.role}
                          </div>
                        </div>
                        {" "}{u.badge}{" "}
                      </div>
                      <div style={{ paddingTop: "11px", borderTop: "1px solid var(--border-subtle)", font: "var(--type-body-sm)", color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
                        <span dir="ltr">
                          {u.email}
                        </span>
                      </div>
                      <div style={{ display: "flex" }}>
                        {u.actionsSpread}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
