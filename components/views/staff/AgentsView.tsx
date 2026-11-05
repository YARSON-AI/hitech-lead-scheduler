"use client";

 
import { Fragment } from "react";
import { Button, Card, SearchableSelect, Table, TextInput } from "@/components/ds";
import { css, type VM } from "@/components/views/vm";

export function AgentsView({ v }: { v: VM }) {
  void Fragment;
  void css;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hti-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ font: "var(--type-h1)" }}>
            סוכנים
          </h1>
          {v.isPhone && (
            <>
              <Button size="sm" variant={v.agentFilterVariant} iconStart="filter" onClick={v.toggleAgentFilters}>
                סינון
              </Button>
            </>
          )}
        </div>
        {v.showAgentFilters && (
          <>
            <Card padding="md">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
                <TextInput label="חיפוש סוכן/ת" placeholder="שם או כתובת מייל" iconStart="search" value={v.agentSearch} onChange={v.onAgentSearch} />
                <SearchableSelect label="התמחות" options={v.specOptions} value={v.spec} onChange={v.onSpec} placeholder="הכל" />
              </div>
            </Card>
          </>
        )}
        <div className={`hti-cq hti-cq-ag ${v.cqMode}`}>
          <div className="hti-cqt">
            <Card padding="none">
              <div style={css(v.tableScroll)} className="hti-xscroll">
                <Table columns={v.agentColumns} rows={v.agentRows} rowKey="id" onRowClick={v.goAgentRow} emptyText="לא נמצאו סוכנים" />
              </div>
            </Card>
          </div>
          <div style={{ flexDirection: "column", gap: "12px" }} className="hti-cqc">
            {(v.agentCards ?? []).map((a: VM, index: number) => (
              <Fragment key={a.key ?? a.id ?? index}>
                <div onClick={a.go} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ minWidth: "0" }}>
                      <div style={{ font: "var(--type-label)", color: "var(--text-primary)" }}>
                        {a.name}
                      </div>
                      <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)", overflowWrap: "anywhere" }}>
                        <span dir="ltr">
                          {a.email}
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: "none" }}>
                      {a.lightEl}
                    </div>
                  </div>
                  {a.disc && (
                    <>
                      <div style={{ display: "flex" }}>
                        {a.discEl}
                      </div>
                    </>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", paddingTop: "11px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                        מגבלה יומית
                      </div>
                      <div style={{ font: "var(--type-label)" }} dir="ltr">
                        {a.daily}
                      </div>
                    </div>
                    <div>
                      <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                        מגבלה חודשית
                      </div>
                      <div style={{ font: "var(--type-label)" }} dir="ltr">
                        {a.monthly}
                      </div>
                    </div>
                    <div>
                      <div style={{ font: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                        משקל
                      </div>
                      <div style={{ font: "var(--type-label)" }} dir="ltr">
                        {a.weight}
                      </div>
                    </div>
                  </div>
                  {a.hasBlock && (
                    <>
                      <div style={{ display: "flex" }}>
                        {a.blockEl}
                      </div>
                    </>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
